import datetime

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, relationship, backref

Base = declarative_base()

class Chat(Base):
	__tablename__ = "chats"

	id = Column(Integer, primary_key = True)
	socket = Column(String, nullable = False)
	active = Column(Boolean, nullable = False, default = True)
	user = Column(String, nullable = False)
	language = Column(String, nullable = False)
	recent = Column(Boolean, nullable = True)

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
	stream = Column(Boolean, nullable = False, default = False)
	href = Column(Boolean, nullable = True, default = False)

	chat = relationship("Chat", backref = backref("messages", lazy = "dynamic"))
	chat_id = Column(Integer, ForeignKey("chats.id"))

	def __repr__(self):
		return self.socket

class Inline(Base):
	__tablename__ = "inlines"

	id = Column(Integer, primary_key = True)
	sent = Column(Boolean, nullable = False, default = False)
	socket = Column(String, nullable = False)

	message_id = Column(Integer, ForeignKey("messages.id"))
	message = relationship("Message", backref = "inlines")

	def __repr__(self):
		return self.socket

class Operator(Base):
	__tablename__ = "operators"

	id = Column(Integer, primary_key = True)
	name = Column(String, nullable = False)
	username = Column(String, nullable = False)
	password = Column(String, nullable = False)

	def __repr__(self):
		return self.name

class Template(Base):
	__tablename__ = "templates"

	id = Column(Integer, primary_key = True)
	message = Column(String, nullable = False)
	language = Column(String, nullable = False)

	user_id = Column(Integer, ForeignKey("operators.id"))
	user = relationship("Operator", backref = "templates")

	def __repr__(self):
		return self.message