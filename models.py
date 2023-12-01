from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class ChatModel(BaseModel):
	id: int
	socket: str
	user: str
	active: bool
	recent: Optional[bool] = None
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

class TemplateModel(BaseModel):
	id: int
	message: str
	language: str

	class Config:
		from_attributes = True

class OperatorModel(BaseModel):
	id: int
	name: str
	username: str
	templates: Optional[List[TemplateModel]] = None

	class Config:
		from_attributes = True