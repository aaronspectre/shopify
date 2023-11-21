from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class ChatModel(BaseModel):
	id: int
	socket: str
	user: str
	active: bool
	recent: bool | None = None
	language: str

class MessageModel(BaseModel):
	id: int
	socket: str
	content: str
	read: bool
	operator: bool
	file: bool
	stream: bool
	href: Optional[bool] = None
	date: datetime
	chat_id: Optional[int] = None

class OperatorModel(BaseModel):
	id: int
	name: str
	username: str