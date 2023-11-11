from typing import Optional
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
	href: bool
	date: datetime
	chat_id: Optional[int] = None

class OperatorModel(BaseModel):
	id: int
	name: str
	username: str