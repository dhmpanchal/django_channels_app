from channels.generic.websocket import AsyncWebsocketConsumer
import json

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = 'Test-Room'

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        await self.accept()
    
    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

        print('Disconnected!')
    
    async def receive(self, text_data):
        receive_data = json.loads(text_data)
        message = receive_data['message']
        action = receive_data['action']

        if action == 'new-offer' or action == 'new-answer':
            receiver_channel_name = receive_data['message']['receiver_channel_name']
            receive_data['message']['receiver_channel_name'] = self.channel_name

            await self.channel_layer.send(
                receiver_channel_name,
                {
                    'type': 'send.sdp',
                    'receive_data': receive_data
                }
            )

            return

        receive_data['message']['receiver_channel_name'] = self.channel_name

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'send.sdp',
                'receive_data': receive_data
            }
        )
    
    async def send_sdp(self, event):
        receive_data = event['receive_data']
        await self.send(text_data=json.dumps(receive_data))