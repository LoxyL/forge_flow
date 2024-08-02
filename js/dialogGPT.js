import {BotGPT, AgentGPT} from "./botGPT.js";

export class DialogGPT {
	constructor() {
		this.dialog_num = 0;
		this.bot = new BotGPT();
		this.agent = new AgentGPT();
		this.current_record_id = 0;
		this._loadRecordList();
	}

	_getInputGPT() {
		var inputElement = document.getElementById("message-send-GPT");
		var inputValue = inputElement.value;
		inputElement.value = "";
		
		inputElement.style.height = 'auto';
		inputElement.style.height = (this.scrollHeight) + 'px';

		return inputValue.trim();
	}

	_processTextDisplay(text) {
		const md = new markdownit({
			highlight: function(code, lang) {
				if (lang && hljs.getLanguage(lang)) {
					return hljs.highlight(code, { language: lang }).value;
				}
				return hljs.highlightAuto(code).value;
			}
		});

		var html = md.render(text);
		return html;
	}

	_clear() {
		this.dialog_num = 0;
		const container = document.getElementById('chat-container-GPT-messages');
		container.innerHTML = '';
		this.bot.body.messages = [this.bot.body.messages[0]];
	}

	_send_message(inputValue) {
		const userSet = document.createElement("div");
		userSet.setAttribute("id", 'chat-container-GPT-messages-user-'+this.dialog_num);
		userSet.setAttribute("class", "chat-container-GPT-messages-user");

		const userIcon = document.createElement("div");
		userIcon.setAttribute("class", "chat-container-GPT-messages-user-icon");
		userIcon.innerHTML = "U";

		const userBubble = document.createElement("div");
		userBubble.setAttribute("class", "chat-container-GPT-messages-user-bubble");
		userBubble.innerHTML = this._processTextDisplay(inputValue);

		userSet.appendChild(userIcon);
		userSet.appendChild(userBubble);
		
		const chatContainer = document.getElementById("chat-container-GPT-messages");
		chatContainer.appendChild(userSet);
	}

	async _receive_message(inputValue) {
		var contentIter = this.bot.interact(inputValue);
		var receive_content = "";
		
		const chatContainer = document.getElementById("chat-container-GPT-messages");

		const botSet = document.createElement("div");
		botSet.setAttribute("id", 'chat-container-GPT-messages-bot-'+this.dialog_num);
		botSet.setAttribute("class", "chat-container-GPT-messages-bot");

		const botIcon = document.createElement("div");
		botIcon.setAttribute("class", "chat-container-GPT-messages-bot-icon");
		botIcon.innerHTML = "B";

		const botBubble = document.createElement("div");
		botBubble.setAttribute("class", "chat-container-GPT-messages-bot-bubble");
		botBubble.innerHTML = this._processTextDisplay("...");

		botSet.appendChild(botIcon);
		botSet.appendChild(botBubble);
		chatContainer.appendChild(botSet);

		for await (const piece of contentIter) {
			if (piece == undefined) continue;
			receive_content += piece;
			botBubble.innerHTML = this._processTextDisplay(receive_content);
		}
		console.log("[INFO]Done receive content.");
	}

	async send() {
		var inputValue = this._getInputGPT();
		if(inputValue !== ""){
			console.log("[INFO]Send content: ", inputValue);
			this._send_message(inputValue);
			this.dialog_num += 1;
			await this._receive_message(inputValue);
			this.dialog_num += 1;
			this._saveRecordContent();
		} 
	}

	_loadRecordList() {
		const recordList = JSON.parse(localStorage.getItem('chat-tool-web-record-list-GPT.json'));
		if(!recordList){
			const newRecordList = {
				recordIds: [0],
				recordTitles: ['New Chat'],
				recordContents: [{}]
			};
			localStorage.setItem('chat-tool-web-record-list-GPT.json', JSON.stringify(newRecordList));
			this._saveRecordContent();
			this._loadRecordList();
			return;
		}
		this.current_record_id = recordList.recordIds[0];

		const recordContainer = document.getElementById('record-container-GPT');
		recordContainer.innerHTML = '';
		for(let i=0; i<recordList.recordIds.length; i++){
			let newRecord = document.createElement('button');
			newRecord.setAttribute('id', `record-GPT-${recordList.recordIds[i]}`);
			newRecord.setAttribute('class', 'record-option');
			newRecord.setAttribute('onclick', `switchRecord(${recordList.recordIds[i]})`)
			newRecord.innerHTML = recordList.recordTitles[i];
			recordContainer.appendChild(newRecord);
		}

		this.switchRecord(this.current_record_id);
	}

	_saveRecordContent() {
		let context = this.bot.body.messages;
		const recordList = JSON.parse(localStorage.getItem('chat-tool-web-record-list-GPT.json'));
		let index = recordList.recordIds.indexOf(this.current_record_id);
		recordList.recordContents[index] = context;
		localStorage.setItem('chat-tool-web-record-list-GPT.json', JSON.stringify(recordList));
	}
	
	newChat() {
		this._clear();
		const recordList = JSON.parse(localStorage.getItem('chat-tool-web-record-list-GPT.json'));
		this.current_record_id += 1;
		recordList.recordIds.unshift(this.current_record_id);
		recordList.recordTitles.unshift('New Chat');
		recordList.recordContents.unshift({});
		localStorage.setItem('chat-tool-web-record-list-GPT.json', JSON.stringify(recordList));
		this._saveRecordContent();
		this._loadRecordList();
		this._loadRecordContent();
	}

	switchRecord(id){
		this.current_record_id = id;
		this._loadRecordContent();

		const options = document.getElementsByClassName('record-option');
		for(let i=0; i<options.length; i++){
			options[i].className = options[i].className.replace(' active', '');
		}

		const option = document.getElementById(`record-GPT-${id}`);
		option.className += ' active';
	}
	
	_loadRecordContent() {
		this._clear();
		const recordList = JSON.parse(localStorage.getItem('chat-tool-web-record-list-GPT.json'));
		let index = recordList.recordIds.indexOf(this.current_record_id);
		let recordContents = recordList.recordContents[index];
		this.bot.body.messages = recordContents;
		for(let i in recordContents){
			const piece = recordContents[i];
			if(piece.role == 'user'){
				const userSet = document.createElement("div");
				userSet.setAttribute("id", 'chat-container-GPT-messages-user-'+this.dialog_num);
				userSet.setAttribute("class", "chat-container-GPT-messages-user");
		
				const userIcon = document.createElement("div");
				userIcon.setAttribute("class", "chat-container-GPT-messages-user-icon");
				userIcon.innerHTML = "U";
		
				const userBubble = document.createElement("div");
				userBubble.setAttribute("class", "chat-container-GPT-messages-user-bubble");
				userBubble.innerHTML = this._processTextDisplay(piece.content);
		
				userSet.appendChild(userIcon);
				userSet.appendChild(userBubble);
				
				const chatContainer = document.getElementById("chat-container-GPT-messages");
				chatContainer.appendChild(userSet);
			}
			if(piece.role == 'assistant'){
				const chatContainer = document.getElementById("chat-container-GPT-messages");

				const botSet = document.createElement("div");
				botSet.setAttribute("id", 'chat-container-GPT-messages-bot-'+this.dialog_num);
				botSet.setAttribute("class", "chat-container-GPT-messages-bot");
		
				const botIcon = document.createElement("div");
				botIcon.setAttribute("class", "chat-container-GPT-messages-bot-icon");
				botIcon.innerHTML = "B";
		
				const botBubble = document.createElement("div");
				botBubble.setAttribute("class", "chat-container-GPT-messages-bot-bubble");
				botBubble.innerHTML = this._processTextDisplay(piece.content);
		
				botSet.appendChild(botIcon);
				botSet.appendChild(botBubble);
				chatContainer.appendChild(botSet);
			}
			this.dialog_num += 1;
		}
	}
}