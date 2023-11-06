import json
import requests
import starlette

from typing import List

from datetime import datetime
from fastapi import FastAPI, WebSocket, Request

from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles

from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine

import tables
import models

root = FastAPI()
sessionbuilder = sessionmaker(bind = create_engine("sqlite:///database.sqlite?charsest=utf8mb4"))
templates = Jinja2Templates(directory = "templates")
root.mount("/static", StaticFiles(directory = "static"), name = "static")
connection_pool = dict()

@root.get('/')
async def index(request: Request):
	pass

@root.websocket("/websocketio")
async def websocket(socketio: WebSocket):
	with sessionbuilder() as session:
		try:
			await socketio.accept()
			while True:
				data = await socketio.receive_text()
				if "CONNECTION_INIT" in data:
					uuid = data.replace("CONNECTION_INIT#", '')
					connection_pool[uuid] = socketio
					chat = tables.Chat(socket = uuid)
					session.add(chat)
					session.commit()
					await socketio.send_text("ACCEPT_HANDSHAKE")
				else:
					if "%^%^%" in data:
						file = True
						data = data.replace("^%");
					else:
						file = False
					data = data.split("%^%")
					chat = session.query(tables.Chat).filter_by(socket = data[0]).first()
					message = tables.Message(content = data[1], socket = data[0], date = datetime.now(), read = False, chat_id = chat.id, file = file)
					session.add(message)
					session.commit()
					await socketio.send_text("SYSTEM_CALL")
		except starlette.websockets.WebSocketDisconnect as disconnect:
			print("Connection dropped by client")


@root.get("/view/root")
async def view_root(request: Request):
	return templates.TemplateResponse("root.html", {"request": request})

@root.get("/view/chats")
async def view_chats(request: Request):
	return templates.TemplateResponse("chats.html", {"request": request})

@root.get("/chats", response_model = List[models.ChatModel])
async def chats():
	with sessionbuilder() as session:
		chats = session.query(tables.Chat).filter_by(active = True).order_by(tables.Chat.id.desc()).all()
		return chats

@root.get("/messages", response_model = List[models.MessageModel])
async def messages(chat_id: int):
	with sessionbuilder() as session:
		messages = session.query(tables.Message).filter_by(chat_id = chat_id).all()
		return messages

@root.post("/message/new", response_model = bool)
async def new_message(request: Request):
	with sessionbuilder() as session:
		payload = await request.json()
		message = tables.Message(
			content = payload["content"],
			date = datetime.now(),
			socket = payload["socket"],
			read = False,
			chat_id = payload["chat_id"],
			operator = True
		)
		session.add(message)
		session.commit()

		if connection_pool.get(message.socket, False):
			try:
				await connection_pool[message.socket].send_text(message.content)
			except Exception as error:
				chat = session.query(tables.Chat).filter_by(id = message.chat_id).first()
				chat.active = False
				session.commit()
		else:
			chat = session.query(tables.Chat).filter_by(id = message.chat_id).first()
			chat.active = False
			session.commit()
		return True