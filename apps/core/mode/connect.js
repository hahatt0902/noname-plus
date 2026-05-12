import { lib, game, ui, get, ai, _status } from "noname";
export const type = "mode";
/**
 * @type { () => importModeConfig }
 */
export default () => {
	return {
		name: "connect",
		start() {
			// 默认关闭 BGM，但保留卡牌/技能音效
			if (lib.config.background_music !== "music_off") {
				game.saveConfig("background_music", "music_off");
			}
			if (lib.config.background_audio === false) {
				game.saveConfig("background_audio", true);
			}
			var directstartmode = lib.config.directstartmode;
			ui.create.menu(true);
			event.textnode = ui.create.div("", "输入联机地址");
			event.textnode.style.display = "none";
			var createNode = function () {
				if (event.created) {
					return;
				}
				if (directstartmode && lib.node) {
					ui.exitroom = ui.create.system(
						"退出房间",
						function () {
							game.saveConfig("directstartmode");
							game.reload();
						},
						true
					);
					game.switchMode(directstartmode);
					return;
				}
				if (lib.node && window.require) {
					ui.startServer = ui.create.system(
						"启动服务器",
						function (e) {
							ui.click.shortcut(false);
							e.stopPropagation();
							ui.click.connectMenu();
						},
						true
					);
					// 固定服务器：隐藏本地启动服务器按钮
					ui.startServer.style.display = "none";
				}

				event.created = true;

				// 创建联机面板（仅作为连接超时提示容器，平时隐藏）
				var panel = document.createElement("div");
				panel.className = "connect-panel";
				panel.style.display = "none";
				ui.window.appendChild(panel);
				ui.connectPanel = panel;

				// 标题和分隔线已删除（仅保留联机模式，无需标题）

				// IP 输入区（固定服务器：隐藏，不允许用户修改）
				var ipWrap = document.createElement("div");
				ipWrap.className = "connect-ip-wrap";
				ipWrap.style.display = "none";
				var node = document.createElement("input");
				node.className = "connect-ip-input";
				node.type = "text";
				node.placeholder = "输入联机地址...";
				node.value = lib.hallURL || "";
				node.readOnly = true;
				ipWrap.appendChild(node);
				panel.appendChild(ipWrap);
				ui.ipnode = node;

				// 状态文字
				var text = event.textnode;
				text.className = "connect-status-text";
				text.style.width = "";
				text.style.height = "";
				text.style.lineHeight = "";
				text.style.fontFamily = "";
				text.style.fontSize = "";
				text.style.padding = "";
				text.style.left = "";
				text.style.top = "";
				text.style.textAlign = "";
				panel.appendChild(text);
				ui.iptext = text;

				var connect = function (e) {
					if (e) {
						e.preventDefault();
					}
					var ip = node.value.trim();
					if (!ip) return;
					text.textContent = "正在连接...";
					text.className = "connect-status-text connecting";
					clearTimeout(event.timeout);
					game.requireSandboxOn(ip);
					game.saveConfig("last_ip", ip);
					game.connect(ip, function (success) {
						if (success) {
							var info = lib.config.reconnect_info;
							if (info && info[0] == _status.ip) {
								game.onlineID = info[1];
								if (typeof (game.roomId = info[2]) == "string") {
									game.roomIdServer = true;
								}
							}
							return;
						}
						if (event.textnode) {
							text.textContent = "连接失败，请检查地址";
							text.className = "connect-status-text error";
							event.textnode.textContent = "连接失败，请检查地址";
							setTimeout(function () {
								if (event.textnode) {
									text.textContent = "";
									text.className = "connect-status-text";
									event.textnode.textContent = "";
								}
							}, 3000);
						}
					});
				};
				node.addEventListener("keydown", function (e) {
					if (e.key == "Enter") {
						connect(e);
					}
				});

				// 按钮行（固定服务器：隐藏手动连接按钮）
				var btnRow = document.createElement("div");
				btnRow.className = "connect-btn-row";
				btnRow.style.display = "none";
				var button = document.createElement("div");
				button.className = "connect-btn primary";
				button.textContent = "连接";
				button.addEventListener("click", connect);
				btnRow.appendChild(button);
				panel.appendChild(btnRow);
				ui.ipbutton = button;

				ui.hall_button = ui.create.system(
					"联机大厅",
					function () {
						node.value = get.config("hall_ip") || lib.hallURL;
						connect();
					},
					true
				);
				// 固定服务器：隐藏“联机大厅”切换按钮
				ui.hall_button.style.display = "none";
				ui.recentIP = ui.create.system("最近连接", null, true);
				// 固定服务器：隐藏“最近连接”
				ui.recentIP.style.display = "none";
				var clickLink = function () {
					node.value = this.textContent;
					connect();
				};
				lib.setPopped(
					ui.recentIP,
					function () {
						if (!lib.config.recentIP.length) {
							return;
						}
						var uiintro = ui.create.dialog("hidden");
						uiintro.listen(function (e) {
							e.stopPropagation();
						});
						var list = ui.create.div(".caption");
						for (var i = 0; i < lib.config.recentIP.length; i++) {
							ui.create.div(".text.textlink", list, clickLink).textContent = get.trimip(lib.config.recentIP[i]);
						}
						uiintro.add(list);
						var clear = uiintro.add('<div class="text center">清除</div>');
						clear.style.paddingTop = 0;
						clear.style.paddingBottom = "3px";
						clear.listen(function () {
							lib.config.recentIP.length = 0;
							game.saveConfig("recentIP", []);
							uiintro.delete();
						});
						return uiintro;
					},
					220
				);

				// 面板中显示最近连接记录（固定服务器：禁用）
				if (false && lib.config.recentIP && lib.config.recentIP.length) {
					var recentLabel = document.createElement("div");
					recentLabel.style.cssText = "position:relative;font-size:12px;color:rgba(255,255,255,0.4);margin-bottom:2px;";
					recentLabel.textContent = "最近连接";
					panel.appendChild(recentLabel);
					var recentDiv = document.createElement("div");
					recentDiv.className = "connect-recent-list";
					for (var ri = 0; ri < lib.config.recentIP.length && ri < 5; ri++) {
						(function (ipAddr) {
							var item = document.createElement("div");
							item.className = "connect-recent-item";
							item.textContent = get.trimip(ipAddr);
							item.addEventListener("click", function () {
								node.value = ipAddr;
								connect();
							});
							recentDiv.appendChild(item);
						})(lib.config.recentIP[ri]);
					}
					panel.appendChild(recentDiv);
				}

				// 邀请链接读取已禁用（仅保留联机功能）
				if (false && get.config("read_clipboard", "connect")) {
					var ced = false;
					var read = function (clipText) {
						try {
							var text2 = clipText.split("\n")[2];
							var ip = text2.slice(5);
							if (ip.length > 0 && text2.startsWith("联机地址:") && (ced || confirm("是否根据剪贴板的邀请链接以进入联机地址和房间？"))) {
								node.value = ip;
								text.textContent = "正在连接...";
								text.className = "connect-status-text connecting";
								clearTimeout(event.timeout);
								game.saveConfig("last_ip", ip);
								game.connect(ip, function (success) {
									if (!success && event.textnode) {
										text.textContent = "邀请链接解析失败";
										text.className = "connect-status-text error";
										event.textnode.textContent = "邀请链接解析失败";
									}
									if (success) {
										_status.read_clipboard_text = clipText;
									}
								});
							}
						} catch (err) {
							console.log(err);
						}
					};
					window.focus();
					if (navigator.clipboard && lib.node) {
						navigator.clipboard
							.readText()
							.then(read)
							.catch(function () {});
					} else {
						var input = ui.create.node("textarea", ui.window, { opacity: "0" });
						input.select();
						var result = document.execCommand("paste");
						input.blur();
						ui.window.removeChild(input);
						if (result || input.value.length > 0) {
							read(input.value);
						} else if (confirm("是否输入邀请链接以进入联机地址和房间？")) {
							ced = true;
							game.prompt("请输入邀请链接", function (clipText) {
								if (typeof clipText === "string" && clipText.length > 0) {
									read(clipText);
								}
							});
						}
					}
				}
				lib.init.onfree();
			};
			createNode();
			// 固定服务器：先要求设置用户名（首次或仍为默认值时弹出 UI），再自动连接
			var doAutoConnect = function () {
				setTimeout(function () {
					if (ui.ipbutton && typeof ui.ipbutton.click === "function") {
						ui.ipnode.value = lib.hallURL;
						ui.ipbutton.click();
					}
				}, 50);
			};
			if (lib.hallURL && ui.ipnode) {
				var currentNick = lib.config.connect_nickname;
				var needAsk = !currentNick || currentNick === "无名玩家";
				if (needAsk) {
					// 构建用户名设置 UI（与游戏背景同风格）
					var overlay = document.createElement("div");
					overlay.className = "nickname-overlay";
					var box = document.createElement("div");
					box.className = "connect-panel nickname-box";
					box.style.position = "absolute";
					box.style.left = "50%";
					box.style.top = "50%";
					box.style.transform = "translate(-50%, -50%)";
					var title = document.createElement("div");
					title.className = "connect-panel-title";
					title.textContent = "设 置 昵 称";
					box.appendChild(title);
					var divider = document.createElement("div");
					divider.className = "connect-divider";
					box.appendChild(divider);
					var wrap = document.createElement("div");
					wrap.className = "connect-ip-wrap";
					var input = document.createElement("input");
					input.className = "connect-ip-input";
					input.type = "text";
					input.maxLength = 12;
					input.placeholder = "请输入 1-12 位昵称";
					wrap.appendChild(input);
					box.appendChild(wrap);
					var hint = document.createElement("div");
					hint.className = "connect-status-text";
					hint.textContent = "昵称将用于联机时显示";
					box.appendChild(hint);
					var btnRow = document.createElement("div");
					btnRow.className = "connect-btn-row";
					var okBtn = document.createElement("div");
					okBtn.className = "connect-btn primary";
					okBtn.textContent = "确 定";
					btnRow.appendChild(okBtn);
					box.appendChild(btnRow);
					overlay.appendChild(box);
					ui.window.appendChild(overlay);
					setTimeout(function () { input.focus(); }, 50);
					var submit = function () {
						var v = (input.value || "").trim().slice(0, 12);
						if (!v) {
							hint.textContent = "昵称不能为空";
							hint.className = "connect-status-text error";
							return;
						}
						game.saveConfig("connect_nickname", v);
						game.saveConfig("connect_nickname", v, "connect");
						overlay.parentNode && overlay.parentNode.removeChild(overlay);
						doAutoConnect();
					};
					okBtn.addEventListener("click", submit);
					input.addEventListener("keydown", function (e) {
						if (e.key === "Enter") submit();
					});
				} else {
					doAutoConnect();
				}
			}
			if (!game.onlineKey) {
				game.onlineKey = localStorage.getItem(lib.configprefix + "key");
				if (!game.onlineKey) {
					game.onlineKey = get.id();
					localStorage.setItem(lib.configprefix + "key", game.onlineKey);
				}
			}
			_status.connectDenied = createNode;
			setTimeout(lib.init.onfree, 1000);
		},
	};
};
