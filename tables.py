import datetime

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, relationship, backref

Base = declarative_base()

class Chat(Base):
	__tablename__ = "chats"

	id = Column(Integer, primary_key = True)
	socket = Column(String, nullable = False)
	active = Column(Boolean, nullable = False, default = True)

	def __repr__(self):
		return self.content


class Message(Base):
	__tablename__ = "messages"

	id = Column(Integer, primary_key = True)
	content = Column(String, nullable = False)
	socket = Column(String, nullable = False)
	date = Column(DateTime, nullable = False)
	read = Column(Boolean, nullable = False, default = False)
	operator = Column(Boolean, nullable = False, default = False)

	file = Column(Boolean, nullable = False, default = False)

	chat = relationship("Chat", backref = backref("messages", lazy = "dynamic"))
	chat_id = Column(Integer, ForeignKey("chats.id"))

	def __repr__(self):
		return self.socket