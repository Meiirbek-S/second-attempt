"""Find private chats for your bot without putting its token in shell history."""
import getpass
import json
import urllib.request
import urllib.error

token = getpass.getpass('Telegram bot token (hidden): ').strip()
try:
    request = urllib.request.Request('https://api.telegram.org/bot' + token + '/getUpdates', data=b'{}', headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(request, timeout=15) as response:
        result = json.load(response)
    chats = {}
    for update in result.get('result', []):
        chat = update.get('message', {}).get('chat', {})
        if chat.get('type') == 'private':
            chats[chat['id']] = chat.get('first_name', 'Private chat')
    for chat_id, name in chats.items():
        print(f'{name}: {chat_id}')
    if not chats:
        print('No private chats found. Send /start to the bot and retry.')
except Exception:
    # Never print an exception containing the token-bearing request URL.
    print('Could not read updates. Check the token, network and whether this bot has an existing webhook.')
