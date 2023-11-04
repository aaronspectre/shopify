from datetime import datetime
from pydantic import BaseModel

class ChatModel(BaseModel):
	id: int
	socket: str

class MessageModel(BaseModel):
	id: int
	socket: str
	content: str
	read: bool
	operator: bool
	date: datetime
	chat_id: int