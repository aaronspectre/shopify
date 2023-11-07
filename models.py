from datetime import datetime
from pydantic import BaseModel

class ChatModel(BaseModel):
	id: int
	socket: str
	user: str
	language: str

class MessageModel(BaseModel):
	id: int
	socket: str
	content: str
	read: bool
	operator: bool
	file: bool
	stream: bool
	date: datetime
	chat_id: int