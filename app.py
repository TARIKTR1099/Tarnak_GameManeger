import streamlit as st
import google.generativeai as genai

st.set_page_config(page_title="GameManager", page_icon="🎮", layout="wide")

st.title("🎮 GameManager")
st.markdown("Gemini AI ile oyunlarınızı yönetin! Öneri alın, liste oluşturun...")

# Sidebar for API key
api_key = st.sidebar.text_input("Gemini API Key:", type="password", help="https://aistudio.google.com/app/apikey adresinden alın")
if not api_key:
    st.info("👈 Sol panelden Gemini API key'inizi girin.")
    st.stop()

try:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')
    st.sidebar.success("API key yüklendi!")
except Exception as e:
    st.error(f"API key hatası: {e}")
    st.stop()

# Chat interface
if "messages" not in st.session_state:
    st.session_state.messages = []

for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

if prompt := st.chat_input("Oyun önerisi isteyin veya yönetin (örn: 'Yeni oyunlar öner')"):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("assistant"):
        response = model.generate_content(prompt)
        st.markdown(response.text)
        st.session_state.messages.append({"role": "assistant", "content": response.text})
