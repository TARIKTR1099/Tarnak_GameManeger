import logging
import json
import os
import threading
import time
import psutil
import subprocess
import glob
import ctypes
from ctypes import wintypes
import keyboard
import pyautogui
from flask import Flask, request, jsonify
from flask_cors import CORS
import pynput

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# --- Network & Firewall Logic ---

class NetworkMonitor:
    def __init__(self):
        self.processes = {} # pid -> {'last_io': io_counters, 'speed': 0, 'name': name, 'exe': exe}
        self.lock = threading.Lock()
        self.running = True
        
    def update_loop(self):
        while self.running:
            try:
                self._update()
            except Exception as e:
                logger.error(f"Monitor error: {e}")
            time.sleep(1)
            
    def _update(self):
        with self.lock:
            current_pids = set()
            for proc in psutil.process_iter(['pid', 'name', 'exe', 'io_counters']):
                try:
                    pid = proc.info['pid']
                    current_pids.add(pid)
                    
                    io = proc.info['io_counters']
                    if not io: continue
                    
                    current_bytes = io.read_bytes + io.write_bytes
                    
                    if pid in self.processes:
                        # Calculate speed
                        prev = self.processes[pid]
                        prev_bytes = prev['last_io'].read_bytes + prev['last_io'].write_bytes
                        speed = current_bytes - prev_bytes
                        
                        self.processes[pid]['speed'] = speed
                        self.processes[pid]['last_io'] = io
                    else:
                        # New process
                        self.processes[pid] = {
                            'pid': pid,
                            'name': proc.info['name'],
                            'exe': proc.info['exe'],
                            'last_io': io,
                            'speed': 0
                        }
                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                    pass
            
            # Cleanup dead processes
            for pid in list(self.processes.keys()):
                if pid not in current_pids:
                    del self.processes[pid]

    def get_top_consumers(self, limit=10):
        with self.lock:
            # Sort by speed desc
            sorted_procs = sorted(self.processes.values(), key=lambda x: x['speed'], reverse=True)
            return sorted_procs[:limit]

class FirewallManager:
    def __init__(self):
        self.blocked_apps = set() # Set of exe paths
        self.whitelist = set()
        self.mode = 'soft' # soft, hard, pro
        
    def block_app(self, exe_path):
        if not exe_path or exe_path in self.whitelist or exe_path in self.blocked_apps:
            return False
            
        rule_name = f"GM_Block_{os.path.basename(exe_path)}"
        try:
            # netsh advfirewall firewall add rule name="..." dir=out action=block program="..."
            cmd = f'netsh advfirewall firewall add rule name="{rule_name}" dir=out action=block program="{exe_path}"'
            subprocess.run(cmd, shell=True, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            self.blocked_apps.add(exe_path)
            logger.info(f"Blocked: {exe_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to block {exe_path}: {e}")
            return False

    def unblock_app(self, exe_path):
        if exe_path not in self.blocked_apps:
            return False
            
        rule_name = f"GM_Block_{os.path.basename(exe_path)}"
        try:
            cmd = f'netsh advfirewall firewall delete rule name="{rule_name}"'
            subprocess.run(cmd, shell=True, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            self.blocked_apps.remove(exe_path)
            logger.info(f"Unblocked: {exe_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to unblock {exe_path}: {e}")
            return False

    def clear_all_rules(self):
        # Delete all rules starting with GM_Block_
        # This is tricky with netsh, usually we iterate our tracked list
        for exe in list(self.blocked_apps):
            self.unblock_app(exe)

# --- Win32 API Constants and Types ---
user32 = ctypes.windll.user32
kernel32 = ctypes.windll.kernel32
WM_LBUTTONDOWN = 0x0201
WM_LBUTTONUP = 0x0202
MK_LBUTTON = 0x0001
HIGH_PRIORITY_CLASS = 0x00000080
NORMAL_PRIORITY_CLASS = 0x00000020

def set_process_priority(pid, priority):
    try:
        handle = kernel32.OpenProcess(0x0200 | 0x0400, False, pid) # PROCESS_SET_INFORMATION | PROCESS_QUERY_INFORMATION
        if not handle:
            return False
        kernel32.SetPriorityClass(handle, priority)
        kernel32.CloseHandle(handle)
        return True
    except Exception as e:
        logger.error(f"Failed to set priority: {e}")
        return False

def get_open_windows():
    windows = []
    def enum_window_proc(hwnd, lParam):
        length = user32.GetWindowTextLengthW(hwnd)
        if length > 0:
            buff = ctypes.create_unicode_buffer(length + 1)
            user32.GetWindowTextW(hwnd, buff, length + 1)
            if user32.IsWindowVisible(hwnd):
                windows.append({'hwnd': hwnd, 'title': buff.value})
        return True
    
    WNDENUMPROC = ctypes.WINFUNCTYPE(ctypes.c_bool, wintypes.HWND, wintypes.LPARAM)
    user32.EnumWindows(WNDENUMPROC(enum_window_proc), 0)
    return windows

# --- Ultra Mode & DNS Logic ---

class UltraModeManager:
    def __init__(self):
        self.active = False
        self.game_pid = None
        self.low_priority_pids = []

    def enable(self, game_pid):
        if self.active: return False
        
        try:
            # Set Game to High Priority
            set_process_priority(game_pid, HIGH_PRIORITY_CLASS)
            self.game_pid = game_pid
            
            # Set others to Idle
            targets = ['chrome.exe', 'firefox.exe', 'msedge.exe', 'discord.exe', 'spotify.exe', 'steamwebhelper.exe']
            
            for proc in psutil.process_iter(['pid', 'name']):
                if proc.info['name'].lower() in targets and proc.info['pid'] != game_pid:
                    try:
                        p = psutil.Process(proc.info['pid'])
                        p.nice(psutil.IDLE_PRIORITY_CLASS)
                        self.low_priority_pids.append(proc.info['pid'])
                    except:
                        pass
                        
            self.active = True
            return True
        except Exception as e:
            logger.error(f"Ultra Mode Enable Error: {e}")
            return False

    def disable(self):
        if not self.active: return False
        
        try:
            # Restore Game Priority
            if self.game_pid:
                set_process_priority(self.game_pid, NORMAL_PRIORITY_CLASS)
                
            # Restore others
            for pid in self.low_priority_pids:
                try:
                    p = psutil.Process(pid)
                    p.nice(psutil.NORMAL_PRIORITY_CLASS)
                except:
                    pass
            
            self.low_priority_pids = []
            self.game_pid = None
            self.active = False
            return True
        except Exception as e:
            logger.error(f"Ultra Mode Disable Error: {e}")
            return False

class DNSManager:
    def __init__(self):
        self.servers = {
            'Google': '8.8.8.8',
            'Cloudflare': '1.1.1.1',
            'OpenDNS': '208.67.222.222',
            'Quad9': '9.9.9.9'
        }
        
    def benchmark(self):
        results = []
        for name, ip in self.servers.items():
            try:
                # Ping
                output = subprocess.check_output(f"ping -n 1 -w 1000 {ip}", shell=True).decode()
                if "time=" in output:
                    ms = int(output.split("time=")[1].split("ms")[0])
                    results.append({'name': name, 'ip': ip, 'latency': ms})
                else:
                    results.append({'name': name, 'ip': ip, 'latency': 999})
            except:
                results.append({'name': name, 'ip': ip, 'latency': 999})
        
        results.sort(key=lambda x: x['latency'])
        return results

    def set_dns(self, dns_ip):
        try:
            cmd_wifi = f'netsh interface ip set dns "Wi-Fi" static {dns_ip}'
            cmd_eth = f'netsh interface ip set dns "Ethernet" static {dns_ip}'
            
            subprocess.run(cmd_wifi, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            subprocess.run(cmd_eth, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            
            return True
        except Exception as e:
            logger.error(f"Set DNS Error: {e}")
            return False

# Initialize Managers
network_monitor = NetworkMonitor()
firewall_manager = FirewallManager()
ultra_manager = UltraModeManager()
dns_manager = DNSManager()

# Auto‑Launcher configuration
CONFIG_PATH = os.path.join(os.path.dirname(__file__), 'game_autolaunch_config.json')

def load_config():
    if not os.path.exists(CONFIG_PATH):
        return []
    with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_config(data):
    with open(CONFIG_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

# Global state for remapping
remapping_active = False

# Helper to perform actions
def perform_action(action, game_pid=None):
    global remapping_active
    action_type = action.get('type')
    if action_type == 'remap_profile':
        profile = action.get('profile', 'classic')
        remapping_active = True
        keyboard.unhook_all()
        if profile == 'classic':
            keyboard.remap_key('up', 'w')
            keyboard.remap_key('down', 's')
            keyboard.remap_key('left', 'a')
            keyboard.remap_key('right', 'd')
            keyboard.remap_key('space', '1')
            keyboard.remap_key('tab', 'page down')
        elif profile == 'numpad':
            keyboard.remap_key('8', 'w')
            keyboard.remap_key('5', 's')
            keyboard.remap_key('4', 'a')
            keyboard.remap_key('6', 'd')
            keyboard.remap_key('7', 'q')
            keyboard.remap_key('9', 'e')
            keyboard.remap_key('0', 'space')
            keyboard.remap_key('enter', 'f')
        logger.info(f"Remap profile applied: {profile}")
    elif action_type == 'ultra_mode':
        if game_pid:
            ultra_manager.enable(game_pid)
            logger.info(f"Ultra mode enabled for PID {game_pid}")
    elif action_type == 'background_clicker':
        hwnd = action.get('hwnd')
        interval = action.get('interval', 1000)
        if hwnd:
            threading.Thread(target=background_click_thread, args=(hwnd, interval, True), daemon=True).start()
            logger.info(f"Background clicker started on HWND {hwnd}")
    elif action_type == 'set_dns':
        provider = action.get('provider')
        if provider:
            dns_ip = dns_manager.servers.get(provider)
            if dns_ip:
                dns_manager.set_dns(dns_ip)
                logger.info(f"DNS set to {provider} ({dns_ip})")
    elif action_type == 'clean_ram':
        clean_ram_logic()
        logger.info("RAM clean triggered")
    else:
        logger.warning(f"Unknown action type: {action_type}")

def clean_ram_logic():
    targets = ['chrome.exe', 'firefox.exe', 'msedge.exe', 'discord.exe', 'spotify.exe']
    killed = []
    freed = 0
    for proc in psutil.process_iter(['pid', 'name', 'memory_info']):
        try:
            if proc.info['name'].lower() in targets:
                mem = proc.info['memory_info'].rss
                proc.terminate()
                killed.append(proc.info['name'])
                freed += mem
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    return killed, freed

# Monitor thread to watch for game launches
handled_pids = set()
def game_monitor_thread():
    while True:
        try:
            config = load_config()
            for entry in config:
                exe_path = entry.get('exe_path')
                actions = entry.get('actions', [])
                for proc in psutil.process_iter(['pid', 'exe']):
                    try:
                        if proc.info['exe'] and os.path.normcase(proc.info['exe']) == os.path.normcase(exe_path):
                            pid = proc.info['pid']
                            if pid not in handled_pids:
                                handled_pids.add(pid)
                                logger.info(f"Game launched: {exe_path} (PID {pid})")
                                for act in actions:
                                    perform_action(act, game_pid=pid)
                    except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                        continue
        except Exception as e:
            logger.error(f"Auto‑launcher monitor error: {e}")
        time.sleep(2)

def background_click_thread(hwnd, interval, loop):
    global playing
    logger.info(f"Background clicking started on HWND: {hwnd}")
    try:
        while playing:
            x, y = 100, 100
            lparam = y << 16 | x
            
            user32.PostMessageW(hwnd, WM_LBUTTONDOWN, MK_LBUTTON, lparam)
            time.sleep(0.05)
            user32.PostMessageW(hwnd, WM_LBUTTONUP, 0, lparam)
            
            if not loop:
                break
            
            if interval > 0:
                time.sleep(interval / 1000.0)
    except Exception as e:
        logger.error(f"Bg click error: {e}")
    finally:
        playing = False

# Global state
recording = False
playing = False
recorded_macro = []
start_time = 0

# Disable fail-safe for now (be careful!)
pyautogui.FAILSAFE = True

def record_mouse_keyboard():
    global recording, recorded_macro, start_time
    logger.info("Recording started...")
    recorded_macro = []
    start_time = time.time()
    
    def on_move(x, y):
        if recording:
            recorded_macro.append({
                'type': 'move',
                'x': x,
                'y': y,
                'time': time.time() - start_time
            })

    def on_click(x, y, button, pressed):
        if recording:
            recorded_macro.append({
                'type': 'click',
                'x': x,
                'y': y,
                'button': str(button),
                'pressed': pressed,
                'time': time.time() - start_time
            })

    mouse_listener = pynput.mouse.Listener(on_move=on_move, on_click=on_click)
    mouse_listener.start()
    
    def on_press(key):
        if recording:
            try:
                k = key.char
            except:
                k = str(key)
            recorded_macro.append({'type': 'key_down', 'key': k, 'time': time.time() - start_time})

    def on_release(key):
        if recording:
            try:
                k = key.char
            except:
                k = str(key)
            recorded_macro.append({'type': 'key_up', 'key': k, 'time': time.time() - start_time})

    keyboard_listener = pynput.keyboard.Listener(on_press=on_press, on_release=on_release)
    keyboard_listener.start()

    while recording:
        time.sleep(0.01)

    mouse_listener.stop()
    keyboard_listener.stop()
    logger.info("Recording stopped.")

def play_macro_thread(macro, loop=False, interval=0):
    global playing
    logger.info("Playback started...")
    
    try:
        while playing:
            start_play_time = time.time()
            
            for action in macro:
                if not playing: break
                
                target_time = action['time']
                current_offset = time.time() - start_play_time
                if target_time > current_offset:
                    time.sleep(target_time - current_offset)
                
                if action['type'] == 'move':
                    pyautogui.moveTo(action['x'], action['y'], _pause=False)
                elif action['type'] == 'click':
                    if action['pressed']:
                        button = action['button'].replace('Button.', '')
                        pyautogui.mouseDown(button=button, _pause=False)
                    else:
                        button = action['button'].replace('Button.', '')
                        pyautogui.mouseUp(button=button, _pause=False)
                elif action['type'] == 'key_down':
                    k = action['key'].replace("'", "")
                    if 'Key.' in k:
                        k = k.replace('Key.', '')
                    pyautogui.keyDown(k, _pause=False)
                elif action['type'] == 'key_up':
                    k = action['key'].replace("'", "")
                    if 'Key.' in k:
                        k = k.replace('Key.', '')
                    pyautogui.keyUp(k, _pause=False)
            
            if not loop:
                break
            
            if interval > 0:
                time.sleep(interval / 1000.0)
                
    except Exception as e:
        logger.error(f"Playback error: {e}")
    finally:
        playing = False
        logger.info("Playback finished.")

# --- Routes ---

@app.route('/status', methods=['GET'])
def get_status():
    return jsonify({
        'recording': recording,
        'playing': playing,
        'macro_length': len(recorded_macro)
    })

@app.route('/start-recording', methods=['POST'])
def start_rec():
    global recording, recorded_macro
    if recording:
        return jsonify({'error': 'Already recording'}), 400
    
    recording = True
    recorded_macro = []
    threading.Thread(target=record_mouse_keyboard).start()
    return jsonify({'status': 'started'})

@app.route('/stop-recording', methods=['POST'])
def stop_rec():
    global recording
    if not recording:
        return jsonify({'error': 'Not recording'}), 400
    
    recording = False
    time.sleep(0.5)
    return jsonify({'status': 'stopped', 'macro': recorded_macro})

@app.route('/play-macro', methods=['POST'])
def play_rec():
    global playing
    if playing:
        return jsonify({'error': 'Already playing'}), 400
    
    data = request.json
    macro = data.get('macro', [])
    loop = data.get('loop', False)
    interval = data.get('interval', 0)
    
    if not macro:
        return jsonify({'error': 'No macro provided'}), 400

    playing = True
    threading.Thread(target=play_macro_thread, args=(macro, loop, interval)).start()
    return jsonify({'status': 'playing'})

@app.route('/stop-playback', methods=['POST'])
def stop_play():
    global playing
    playing = False
    return jsonify({'status': 'stopped'})

@app.route('/check-color', methods=['POST'])
def check_color():
    data = request.json
    x = data.get('x')
    y = data.get('y')
    target_hex = data.get('color') # #RRGGBB
    
    if x is None or y is None:
        x, y = pyautogui.position()
        
    try:
        pixel = pyautogui.pixel(x, y)
        current_hex = '#{:02x}{:02x}{:02x}'.format(pixel[0], pixel[1], pixel[2])
        
        match = False
        if target_hex:
            match = current_hex.lower() == target_hex.lower()
            
        return jsonify({
            'x': x, 
            'y': y, 
            'color': current_hex, 
            'match': match
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get-cursor-info', methods=['GET'])
def get_cursor_info():
    x, y = pyautogui.position()
    pixel = pyautogui.pixel(x, y)
    color = '#{:02x}{:02x}{:02x}'.format(pixel[0], pixel[1], pixel[2])
    return jsonify({'x': x, 'y': y, 'color': color})

@app.route('/windows', methods=['GET'])
def list_windows():
    wins = get_open_windows()
    return jsonify(wins)

@app.route('/start-background-clicker', methods=['POST'])
def start_bg_clicker():
    global playing
    if playing:
        return jsonify({'error': 'Already playing'}), 400
    
    data = request.json
    hwnd = data.get('hwnd')
    interval = data.get('interval', 1000)
    
    if not hwnd:
        return jsonify({'error': 'No window selected'}), 400
        
    playing = True
    threading.Thread(target=background_click_thread, args=(hwnd, interval, True)).start()
    return jsonify({'status': 'started'})

@app.route('/boost/stats', methods=['GET'])
def get_system_stats():
    mem = psutil.virtual_memory()
    return jsonify({
        'ram_total': mem.total,
        'ram_available': mem.available,
        'ram_percent': mem.percent,
        'cpu_percent': psutil.cpu_percent(interval=None)
    })

@app.route('/boost/clean-ram', methods=['POST'])
def clean_ram():
    killed, freed = clean_ram_logic()
    return jsonify({'killed': killed, 'freed_bytes': freed})

@app.route('/scan-games', methods=['GET'])
def scan_games():
    paths = [
        r"C:\Program Files (x86)\Steam\steamapps\common",
        r"C:\Program Files\Steam\steamapps\common",
        r"C:\Program Files\Epic Games",
        r"C:\Program Files (x86)\Epic Games",
    ]
    
    games = []
    for path in paths:
        if os.path.exists(path):
            try:
                dirs = [d for d in os.listdir(path) if os.path.isdir(os.path.join(path, d))]
                for d in dirs:
                    search_path = os.path.join(path, d)
                    exes = glob.glob(os.path.join(search_path, "*.exe"))
                    
                    if exes:
                        exes.sort(key=lambda x: os.path.getsize(x), reverse=True)
                        exe_path = exes[0]
                        
                        games.append({
                            'name': d,
                            'path': exe_path,
                            'platform': 'Steam' if 'Steam' in path else 'Epic'
                        })
            except Exception as e:
                logger.error(f"Error scanning {path}: {e}")
                
    return jsonify(games)

@app.route('/network/usage', methods=['GET'])
def get_network_usage():
    top = network_monitor.get_top_consumers(10)
    result = []
    for p in top:
        result.append({
            'pid': p['pid'],
            'name': p['name'],
            'exe': p['exe'],
            'speed': p['speed'],
            'blocked': p['exe'] in firewall_manager.blocked_apps if p['exe'] else False
        })
    return jsonify(result)

@app.route('/network/block', methods=['POST'])
def block_app():
    data = request.json
    exe = data.get('exe')
    if firewall_manager.block_app(exe):
        return jsonify({'status': 'blocked', 'exe': exe})
    return jsonify({'status': 'failed'}), 400

@app.route('/network/unblock', methods=['POST'])
def unblock_app():
    data = request.json
    exe = data.get('exe')
    if firewall_manager.unblock_app(exe):
        return jsonify({'status': 'unblocked', 'exe': exe})
    return jsonify({'status': 'failed'}), 400

@app.route('/network/clear', methods=['POST'])
def clear_network_rules():
    firewall_manager.clear_all_rules()
    return jsonify({'status': 'cleared'})

@app.route('/ultra/enable', methods=['POST'])
def enable_ultra_mode():
    data = request.json
    pid = data.get('pid') # Game PID
    if not pid:
        return jsonify({'status': 'error', 'message': 'PID required'}), 400
        
    if ultra_manager.enable(pid):
        return jsonify({'status': 'enabled'})
    return jsonify({'status': 'failed'}), 500

@app.route('/ultra/disable', methods=['POST'])
def disable_ultra_mode():
    if ultra_manager.disable():
        return jsonify({'status': 'disabled'})
    return jsonify({'status': 'failed'}), 500

@app.route('/dns/benchmark', methods=['GET'])
def benchmark_dns():
    results = dns_manager.benchmark()
    return jsonify(results)

@app.route('/dns/set', methods=['POST'])
def set_dns_route():
    data = request.json
    ip = data.get('ip')
    if dns_manager.set_dns(ip):
        return jsonify({'status': 'set', 'ip': ip})
    return jsonify({'status': 'failed'}), 500

@app.route('/remap/start', methods=['POST'])
def start_remap():
    global remapping_active
    data = request.json
    profile_type = data.get('profile', 'classic')
    
    if remapping_active:
        keyboard.unhook_all()
    
    remapping_active = True
    
    try:
        if profile_type == 'classic':
            keyboard.remap_key('up', 'w')
            keyboard.remap_key('down', 's')
            keyboard.remap_key('left', 'a')
            keyboard.remap_key('right', 'd')
            keyboard.remap_key('space', '1')
            keyboard.remap_key('tab', 'page down')
        elif profile_type == 'option2':
            keyboard.remap_key('enter', 'w')
            keyboard.remap_key('up', 's')
            keyboard.remap_key('right shift', 'a')
            keyboard.remap_key('1', 'd')
            keyboard.remap_key('left', 'z')
            keyboard.remap_key('down', 'x')
            keyboard.remap_key('right', 'c')
            keyboard.remap_key('4', 'e')
            keyboard.remap_key(',', 'q')
            keyboard.remap_key('tab', 'page down')
        elif profile_type == 'mirror':
            keyboard.remap_key('p', 'q')
            keyboard.remap_key('o', 'w')
            keyboard.remap_key('i', 'e')
            keyboard.remap_key('u', 'r')
            keyboard.remap_key('l', 's')
            keyboard.remap_key('k', 'd')
            keyboard.remap_key('j', 'f')
            keyboard.remap_key('m', 'v')
        elif profile_type == 'numpad':
            keyboard.remap_key('8', 'w')
            keyboard.remap_key('5', 's')
            keyboard.remap_key('4', 'a')
            keyboard.remap_key('6', 'd')
            keyboard.remap_key('7', 'q')
            keyboard.remap_key('9', 'e')
            keyboard.remap_key('0', 'space')
            keyboard.remap_key('enter', 'f')

        return jsonify({'status': 'started', 'profile': profile_type})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/remap/stop', methods=['POST'])
def stop_remap():
    global remapping_active
    remapping_active = False
    try:
        keyboard.unhook_all()
        return jsonify({'status': 'stopped'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Global Hotkey Listener (Runs in background)
def global_hotkey_listener():
    global recording
    logger.info("Global hotkey listener started (Ctrl+Win+R)")
    
    while True:
        try:
            if keyboard.is_pressed('ctrl+windows+r'):
                if recording:
                    recording = False
                    logger.info("Hotkey: Stop Recording")
                    time.sleep(1)
                else:
                    recording = True
                    logger.info("Hotkey: Start Recording")
                    threading.Thread(target=record_mouse_keyboard).start()
                    time.sleep(1)
            time.sleep(0.1)
        except Exception as e:
            logger.error(f"Hotkey error: {e}")
            time.sleep(1)

# Auto-Launcher Routes
@app.route('/autolaunch/config', methods=['GET'])
def get_autolaunch_config():
    return jsonify(load_config())

@app.route('/autolaunch/save', methods=['POST'])
def save_autolaunch_config():
    data = request.json
    save_config(data)
    return jsonify({'status': 'saved'})

@app.route('/launch-game', methods=['POST'])
def launch_game():
    data = request.json
    path = data.get('path')
    if not path or not os.path.exists(path):
        return jsonify({'error': 'Invalid path'}), 400
    
    try:
        # Launch non-blocking
        subprocess.Popen(path, shell=True)
        return jsonify({'status': 'launched', 'path': path})
    except Exception as e:
        logger.error(f"Launch error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Start threads
    threading.Thread(target=network_monitor.update_loop, daemon=True).start()
    threading.Thread(target=game_monitor_thread, daemon=True).start()
    threading.Thread(target=global_hotkey_listener, daemon=True).start()
    
    logger.info("Automation Server running on port 5000")
    app.run(port=5000, debug=False)
