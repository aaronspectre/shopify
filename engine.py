import json
import hashlib
import requests
import starlette

from typing import List

from datetime import datetime
from fastapi import FastAPI, WebSocket, Request, HTTPException

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
				await socketio.send_text("SYSTEM_CALL")
				if "CONNECTION_INIT" in data:
					data = data.split("#CONNECTION_INIT#")
					uuid = data[1]
					connection_pool[uuid] = socketio
					chat = session.query(tables.Chat).filter_by(socket = uuid).first()
					if chat != None:
						chat.active = True
						session.commit()
						await socketio.send_text("ACCEPT_HANDSHAKE")
						continue
					settings = json.loads(data[0])
					chat = tables.Chat(socket = uuid, user = settings["name"], language = settings["language"])
					session.add(chat)
					session.commit()
					await socketio.send_text("ACCEPT_HANDSHAKE")
				else:
					if "&%&" in data:
						data = data.split("&%&")
						stream = True
						file = True
					else:
						data = data.split("%^%")
						file = "https:" in data[1]
						stream = False
					chat = session.query(tables.Chat).filter_by(socket = data[0]).first()
					message = tables.Message(content = data[1], socket = data[0], date = datetime.now(), read = False, chat_id = chat.id, file = file, stream = stream)
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

@root.get("/view/login")
async def view_login(request: Request):
	return templates.TemplateResponse("login.html", {"request": request})

@root.get("/view/cog")
async def view_panel(request: Request):
	return templates.TemplateResponse("cog.html", {"request": request})

@root.get("/view/cog/hire")
async def view_panel_hire(request: Request):
	return templates.TemplateResponse("hire.html", {"request": request})

@root.post("/authorize", response_model = models.OperatorModel)
async def authorize(request: Request):
	with sessionbuilder() as session:
		payload = await request.json()
		operator = session.query(tables.Operator).filter_by(username = payload["username"]).first()
		if operator is None:
			raise HTTPException(status_code = 404, detail = "User not found")
		if operator.password != hashlib.sha256(payload["password"].encode()).hexdigest():
			raise HTTPException(status_code = 404, detail = "Password is incorrect")
		return operator

@root.get("/chats", response_model = List[models.ChatModel])
async def chats():
	with sessionbuilder() as session:
		chats = session.query(tables.Chat).filter_by(active = True).order_by(tables.Chat.id.desc()).all()
		return chats

@root.get("/chats/all", response_model = List[models.ChatModel])
async def chats_all():
	with sessionbuilder() as session:
		chats = session.query(tables.Chat).all()
		return chats

@root.delete("/chats/delete/")
async def chats_delete(chat_id: int):
	with sessionbuilder() as session:
		chat = session.query(tables.Chat).filter_by(id = chat_id).first()
		session.delete(chat)
		session.commit()
		return True

@root.get("/messages", response_model = List[models.MessageModel])
async def messages(chat_id: int):
	with sessionbuilder() as session:
		messages = session.query(tables.Message).filter_by(chat_id = chat_id).all()
		return messages

@root.get("/messages/all", response_model = List[models.MessageModel])
async def chats_all():
	with sessionbuilder() as session:
		messages = session.query(tables.Message).limit(50).all()
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

@root.get("/operator/all", response_model = List[models.OperatorModel])
async def operators():
	with sessionbuilder() as session:
		operators = session.query(tables.Operator).all()
		return operators

@root.post("/operator/new")
async def operator_new(request: Request):
	with sessionbuilder() as session:
		payload = await request.json()
		operator = session.query(tables.Operator).filter_by(username = payload["username"]).first()
		if operator is not None:
			raise HTTPException(status_code = 404, detail = "User already exists")

		operator = tables.Operator(
			name = payload["name"],
			username = payload["username"],
			password = hashlib.sha256(payload["password"].encode()).hexdigest()
		)
		session.add(operator)
		session.commit()
		return True

@root.delete("/operator/delete/")
async def operator_delete(operator_id: int):
	with sessionbuilder() as session:
		operator = session.query(tables.Operator).filter_by(id = operator_id).first()
		session.delete(operator)
		session.commit()
		return True