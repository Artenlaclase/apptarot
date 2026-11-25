    (function () {
      var STORAGE_KEY = "apptarot_random_reading_v1";
      var data = null;
      var cardIndex = null;
      var isFocusMode = false;
      var hasActiveReading = false;

      function getData() {
        if (data) return data;
        var el = document.getElementById("tarot-data");
        data = el
          ? JSON.parse(el.textContent)
          : { allCards: [], arcanosMayores: [], arcanosMenores: [] };
        return data;
      }

      function ensureCardIndex() {
        if (cardIndex) return;
        cardIndex = {};
        getData().allCards.forEach(function (card) {
          cardIndex[card.id] = card;
        });
      }

      function getCardById(cardId) {
        ensureCardIndex();
        return cardIndex[cardId] || null;
      }

      var DEFAULT_IMAGE =
        "https://res.cloudinary.com/die8wz4ag/image/upload/v1747796437/a22_mbkkkq.jpg";

      function shuffle(arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var tmp = a[i];
          a[i] = a[j];
          a[j] = tmp;
        }
        return a;
      }

      function fixUrl(url) {
        if (!url || typeof url !== "string") return DEFAULT_IMAGE;
        var c = url.trim();
        return c.startsWith("http") || c.startsWith("/") ? c : DEFAULT_IMAGE;
      }

      function buildSrc(url) {
        var clean = fixUrl(url);
        if (!clean.includes("res.cloudinary.com")) return clean;
        return clean.replace("/upload/", "/upload/w_380,f_auto,q_auto/");
      }

      function identifier(card) {
        if (card.arcano === "menor" && card.valor) return card.valor;
        return card.numero ? String(card.numero) : "";
      }

      function escapeHtml(str) {
        var d = document.createElement("div");
        d.textContent = str || "";
        return d.innerHTML;
      }

      function detailCardHtml(card, borderClass) {
        var imgSrc = buildSrc(card.imagem);
        var id = identifier(card);
        var label = card.arcano === "mayor" ? "Arcano Mayor" : "Arcano Menor";
        var extraClass = borderClass ? " " + borderClass : "";

        return (
          '<button type="button" class="carta-random-link carta-detail-trigger" data-card-id="' +
          card.id +
          '">' +
          '<article class="carta-random-container' +
          extraClass +
          '">' +
          '<div class="carta-random-image-wrapper">' +
          '<img src="' +
          imgSrc +
          '" alt="Carta ' +
          escapeHtml(card.nombre) +
          '" loading="lazy" class="carta-random-image" ' +
          "onerror=\"this.onerror=null;this.src='" +
          DEFAULT_IMAGE +
          "'\" />" +
          "</div>" +
          '<div class="carta-random-info">' +
          '<h3 class="carta-random-nombre">' +
          escapeHtml(card.nombre) +
          "</h3>" +
          '<div class="text-sm text-gray-600">' +
          '<span class="carta-random-numero">' +
          escapeHtml(id) +
          "</span>" +
          '<span class="block text-xs">' +
          label +
          "</span>" +
          "</div>" +
          "</div>" +
          "</article>" +
          "</button>"
        );
      }

      function saveReadingState(state) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
          console.warn("No se pudo guardar la tirada", e);
        }
      }

      function loadReadingState() {
        try {
          var raw = localStorage.getItem(STORAGE_KEY);
          return raw ? JSON.parse(raw) : null;
        } catch (e) {
          console.warn("No se pudo leer la tirada guardada", e);
          return null;
        }
      }

      function clearReadingState() {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
          console.warn("No se pudo limpiar la tirada guardada", e);
        }
      }

      function collectCurrentState() {
        var selectedIds = [];
        var revealedIds = [];
        var aclaracionIds = [];

        document
          .querySelectorAll("#boardCardsSurface .tarot-board-card:not([data-is-aclaracion='1']), #cardsContainer [data-card]")
          .forEach(function (el) {
            try {
              var card = JSON.parse(el.dataset.card || "{}");
              if (card.id && selectedIds.indexOf(card.id) === -1) selectedIds.push(card.id);
            } catch (e) {}
          });

        document
          .querySelectorAll("#boardCardsSurface .tarot-board-card[data-revealed='1'], #cardsContainer [data-revealed='1']")
          .forEach(function (el) {
            try {
              var card = JSON.parse(el.dataset.card || "{}");
              if (card.id && revealedIds.indexOf(card.id) === -1) revealedIds.push(card.id);
            } catch (e) {}
          });

        document
          .querySelectorAll("#boardCardsSurface .tarot-board-card[data-is-aclaracion='1']")
          .forEach(function (el) {
            var id = el.dataset.cardId;
            if (id && aclaracionIds.indexOf(id) === -1) aclaracionIds.push(id);
          });

        var modeEl = document.querySelector('input[name="tiradaMode"]:checked');
        var countEl = document.getElementById("cardCount");
        var interpretation = document.getElementById("interpretacionTexto");

        var preguntaEl = document.getElementById("tiradaPregunta");

        return {
          mode: modeEl ? modeEl.value : "mixta",
          count: Math.min(
            13,
            Math.max(1, parseInt(countEl ? countEl.value : "3", 10) || 3),
          ),
          selectedIds: selectedIds,
          revealedIds: revealedIds,
          aclaracionIds: aclaracionIds,
          interpretacionHtml: interpretation ? interpretation.innerHTML : "",
          pregunta: preguntaEl ? preguntaEl.value.trim() : "",
        };
      }

      function persistCurrentState() {
        saveReadingState(collectCurrentState());
      }

      function bindDetailTrigger(root) {
        if (!root) return;
        root.addEventListener("click", function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          var cardId = root.dataset.cardId;
          if (!cardId) return;
          openMeaning(cardId);
        });
      }

      function setActionsDisabled(disabled) {
        [
          "generateBtn",
          "resetBtn",
          "aclaracionBtn",
          "revelarTodasBtn",
          "interpretarBtn",
          "guardarTiradaSinInterpBtn",
        ].forEach(function (id) {
          var el = document.getElementById(id);
          if (!el) return;
          el.disabled = !!disabled;
          el.classList.toggle("opacity-60", !!disabled);
          el.classList.toggle("cursor-not-allowed", !!disabled);
        });
      }

      function renderRevealedCard(el, card, animate) {
        el.classList.remove("flippable-card", "flipping");
        el.classList.add("revealed-card");
        if (animate) {
          el.classList.add("card-revealed");
        } else {
          el.classList.remove("card-revealed");
        }
        el.style.cursor = "default";
        el.innerHTML = detailCardHtml(card, "");
        bindDetailTrigger(el.querySelector(".carta-detail-trigger"));
      }

      function revealCard(el, immediate) {
        if (el.dataset.revealed === "1") return;
        el.dataset.revealed = "1";

        var card = JSON.parse(el.dataset.card);

        if (immediate) {
          renderRevealedCard(el, card, false);
          return;
        }

        el.classList.add("flipping");
        setTimeout(function () {
          renderRevealedCard(el, card, true);
          persistCurrentState();
        }, 300);
      }

      var maxBoardZIndex = 10;
      var aclaracionCountOnBoard = 0;

      function calculateBoardPosition(index, total, canvasW, canvasH) {
        var cW = window.innerWidth < 768 ? 140 : 165;
        var cH = window.innerWidth < 768 ? 245 : 288;
        var bW = canvasW || 1200;
        var bH = canvasH || 700;

        var gap = window.innerWidth < 768 ? 12 : 20;
        var totalW = total * cW + (total - 1) * gap;
        var left, top;

        if (totalW <= bW - 40) {
          var startX = (bW - totalW) / 2;
          left = startX + index * (cW + gap);
          top = (bH - cH) / 2;
        } else {
          var perRow = Math.min(6, Math.ceil(total / (total > 6 ? 2 : 1)));
          var row = Math.floor(index / perRow);
          var col = index % perRow;
          var inThisRow = Math.min(perRow, total - row * perRow);
          var rTotalW = inThisRow * cW + (inThisRow - 1) * gap;
          var rStartX = (bW - rTotalW) / 2;
          left = rStartX + col * (cW + gap);
          var rowHeight = cH * 0.85;
          var totalRows = Math.ceil(total / perRow);
          var startY = (bH - (totalRows * rowHeight)) / 2;
          top = startY + row * rowHeight;
        }

        left = Math.max(12, Math.min(bW - cW - 12, left));
        top = Math.max(12, Math.min(bH - cH - 12, top));
        var tilt = (index - (total - 1) / 2) * 2;
        return { left: left, top: top, tilt: tilt };
      }

      function calculateAclaracionPosition(aclIndex, canvasW, canvasH) {
        var cW = window.innerWidth < 768 ? 140 : 165;
        var cH = window.innerWidth < 768 ? 245 : 288;
        var bW = canvasW || 1200;
        var bH = canvasH || 700;

        // Repartir cartas de aclaración en posiciones cómodas sobre el tapete
        var startX = (bW / 2) - (cW / 2);
        var startY = (bH / 2) + 25;
        var offsetX = (aclIndex % 4) * 48 - 65;
        var offsetY = Math.floor(aclIndex / 4) * 35;
        var left = Math.max(20, Math.min(bW - cW - 20, startX + offsetX));
        var top = Math.max(20, Math.min(bH - cH - 20, startY + offsetY));
        var tilt = ((aclIndex % 2 === 0 ? 1 : -1) * 3);
        return { left: left, top: top, tilt: tilt };
      }

      function flipBoardCard(cardEl, forceReveal) {
        if (!cardEl) return;
        var isRev = cardEl.dataset.revealed === "1";
        
        if (forceReveal === true) {
          cardEl.classList.add("is-flipped");
          cardEl.dataset.revealed = "1";
        } else if (isRev) {
          // Volver a voltear boca abajo
          cardEl.classList.remove("is-flipped");
          cardEl.dataset.revealed = "0";
        } else {
          // Voltear para revelar arcano en 3D
          cardEl.classList.add("is-flipped");
          cardEl.dataset.revealed = "1";
        }

        // Sincronizar con la carta de la cuadrícula si existe
        var cardId = cardEl.dataset.cardId;
        if (cardId) {
          var gridCard = document.querySelector('#cardsContainer [data-card-id="' + cardId + '"], #cardsContainer [data-card*="' + cardId + '"]');
          if (gridCard && cardEl.dataset.revealed === "1" && gridCard.dataset.revealed !== "1") {
            revealCard(gridCard, true);
          }
        }

        // Si la carta está revelada, actualizar el panel lateral de significado si está visible
        if (cardEl.dataset.revealed === "1") {
          try {
            var cData = cardEl.dataset.card ? JSON.parse(cardEl.dataset.card) : null;
            if (cData) {
              var sidePanel = document.getElementById("cardMeaningPanel");
              if (sidePanel && window.matchMedia("(min-width: 1280px)").matches) {
                renderMeaningPanel(cData);
              }
            }
          } catch (err) {}
        }

        persistCurrentState();
      }

      function makeBoardCard(card, index, totalCards) {
        var board = document.getElementById("boardCanvas");
        var bW = board ? board.clientWidth : 800;
        var bH = board ? board.clientHeight : 600;

        var pos = calculateBoardPosition(index, totalCards, bW, bH);

        var div = document.createElement("div");
        div.className = "tarot-board-card";
        div.dataset.card = JSON.stringify(card);
        div.dataset.cardId = card.id;
        div.dataset.revealed = "0";
        div.style.left = pos.left + "px";
        div.style.top = pos.top + "px";
        div.style.transform = "rotate(" + pos.tilt + "deg)";
        div.dataset.defaultTilt = pos.tilt.toString();

        var imgSrc = buildSrc(card.imagem);

        div.innerHTML =
          '<div class="tarot-card-inner">' +
            '<!-- Dorso (Boca abajo) -->' +
            '<div class="tarot-card-face tarot-card-back">' +
              '<img src="/cardback.jpg" alt="Dorso de carta" draggable="false" loading="lazy" />' +
            '</div>' +
            '<!-- Cara Frontal (Boca arriba) - Carta completa sin cortes -->' +
            '<div class="tarot-card-face tarot-card-front">' +
              '<img src="' + imgSrc + '" alt="' + escapeHtml(card.nombre) + '" draggable="false" loading="lazy" ' +
                'onerror="this.onerror=null;this.src=\'' + DEFAULT_IMAGE + '\'" />' +
            '</div>' +
          '</div>';

        // Prevenir arrastre fantasma de imágenes por defecto del navegador
        div.addEventListener("dragstart", function (e) {
          e.preventDefault();
        });

        // Doble clic para abrir modal o ficha de significado
        div.addEventListener("dblclick", function (e) {
          e.stopPropagation();
          openMeaning(card.id);
        });

        // Pointer events para arrastre libre desde cualquier punto y volteo con clic
        var isDragging = false;
        var hasMoved = false;
        var startX = 0;
        var startY = 0;
        var startLeft = 0;
        var startTop = 0;

        div.addEventListener("pointerdown", function (e) {
          if (e.button !== 0 && e.pointerType === "mouse") return;
          e.preventDefault();
          isDragging = true;
          hasMoved = false;
          startX = e.clientX;
          startY = e.clientY;
          startLeft = div.offsetLeft;
          startTop = div.offsetTop;

          maxBoardZIndex++;
          div.style.zIndex = maxBoardZIndex.toString();
          div.classList.add("is-dragging");
          try {
            div.setPointerCapture(e.pointerId);
          } catch (err) {}
        });

        div.addEventListener("pointermove", function (e) {
          if (!isDragging) return;
          var dx = e.clientX - startX;
          var dy = e.clientY - startY;

          if (!hasMoved && Math.hypot(dx, dy) > 4) {
            hasMoved = true;
          }

          if (hasMoved) {
            var bCanvas = document.getElementById("boardCanvas");
            var canvasW = bCanvas ? bCanvas.clientWidth : 800;
            var canvasH = bCanvas ? bCanvas.clientHeight : 600;

            var newX = Math.max(0, Math.min(canvasW - div.offsetWidth, startLeft + dx));
            var newY = Math.max(0, Math.min(canvasH - div.offsetHeight, startTop + dy));

            div.style.left = newX + "px";
            div.style.top = newY + "px";
          }
        });

        div.addEventListener("pointerup", function (e) {
          if (!isDragging) return;
          isDragging = false;
          div.classList.remove("is-dragging");
          try {
            div.releasePointerCapture(e.pointerId);
          } catch (err) {}

          if (!hasMoved) {
            // Clic sin arrastrar: voltear la carta en 3D
            flipBoardCard(div);
          } else {
            persistCurrentState();
          }
        });

        div.addEventListener("pointercancel", function () {
          isDragging = false;
          div.classList.remove("is-dragging");
        });

        return div;
      }

      function reorganizeBoardCards() {
        var cards = document.querySelectorAll("#boardCardsSurface .tarot-board-card");
        if (!cards || cards.length === 0) return;

        var board = document.getElementById("boardCanvas");
        var bW = board ? board.clientWidth : 800;
        var bH = board ? board.clientHeight : 600;

        cards.forEach(function (cardEl, idx) {
          var pos = calculateBoardPosition(idx, cards.length, bW, bH);
          cardEl.style.transition = "left 0.4s ease, top 0.4s ease, transform 0.4s ease";
          cardEl.style.left = pos.left + "px";
          cardEl.style.top = pos.top + "px";
          cardEl.style.transform = "rotate(" + pos.tilt + "deg)";
          cardEl.dataset.defaultTilt = pos.tilt.toString();

          setTimeout(function () {
            cardEl.style.transition = "";
          }, 450);
        });

        persistCurrentState();
      }

      function makeCard(card) {
        var div = document.createElement("div");
        div.className = "carta-random-item flippable-card";
        div.style.cursor = "pointer";
        div.dataset.card = JSON.stringify(card);
        div.dataset.cardId = card.id;
        div.dataset.revealed = "0";
        div.innerHTML =
          '<div class="carta-random-container">' +
          '<div class="carta-random-image-wrapper">' +
          '<img src="/cardback.jpg" alt="Carta boca abajo" loading="lazy" class="carta-random-image" ' +
          "onerror=\"this.onerror=null;this.src='" +
          DEFAULT_IMAGE +
          "'\" />" +
          "</div>" +
          '<div class="carta-random-info">' +
          '<h3 class="carta-random-nombre">\u00bf?</h3>' +
          '<div class="text-sm text-gray-600">' +
          '<span class="carta-random-numero">Haz clic para revelar</span>' +
          '<span class="block text-xs">Carta oculta</span>' +
          "</div>" +
          "</div>" +
          "</div>";
        div.addEventListener("click", function () {
          revealCard(div);
        });
        return div;
      }

      function resetSecondarySections() {
        var ac = document.getElementById("aclaracionContainer");
        if (ac) ac.innerHTML = "";

        var as_ = document.getElementById("aclaracionSection");
        if (as_) as_.classList.add("hidden");

        var interpContent = document.getElementById("interpretacionContent");
        if (interpContent) interpContent.classList.add("hidden");

        var interpTxt = document.getElementById("interpretacionTexto");
        if (interpTxt) interpTxt.innerHTML = "";

        hasInterpretacion = false;
      }

      function barajar() {
        aclaracionCountOnBoard = 0;
        var d = getData();
        var modeEl = document.querySelector('input[name="tiradaMode"]:checked');
        var mode = modeEl ? modeEl.value : "mixta";
        var countEl = document.getElementById("cardCount");
        var count = Math.min(
          13,
          Math.max(1, parseInt(countEl ? countEl.value : "3") || 3),
        );

        var pool = mode === "mayores" ? d.arcanosMayores : d.allCards;
        var selected = shuffle(pool).slice(0, Math.min(count, pool.length));

        var container = document.getElementById("cardsContainer");
        if (container) container.innerHTML = "";

        var boardSurface = document.getElementById("boardCardsSurface");
        if (boardSurface) boardSurface.innerHTML = "";

        var boardMsg = document.getElementById("boardInitialMessage");
        if (boardMsg) boardMsg.classList.add("hidden");

        resetSecondarySections();

        selected.forEach(function (card, i) {
          if (container) container.appendChild(makeCard(card));
          if (boardSurface) boardSurface.appendChild(makeBoardCard(card, i, selected.length));
        });

        var aclaracion = document.getElementById("aclaracionControls");
        if (aclaracion) aclaracion.classList.remove("hidden");

        var panel = document.getElementById("actionPanel");
        if (panel) panel.classList.remove("hidden");

        persistCurrentState();
      }

      function limpiar() {
        aclaracionCountOnBoard = 0;
        var container = document.getElementById("cardsContainer");
        if (container) {
          container.innerHTML =
            '<div id="initialMessage" class="col-span-full text-center py-12">' +
            '<p class="text-xl text-gray-500">Selecciona tu modalidad de tirada y presiona &quot;Barajar Cartas&quot;</p>' +
            "</div>";
        }

        var boardSurface = document.getElementById("boardCardsSurface");
        if (boardSurface) boardSurface.innerHTML = "";

        var boardMsg = document.getElementById("boardInitialMessage");
        if (boardMsg) boardMsg.classList.remove("hidden");

        resetSecondarySections();

        var acCtrl = document.getElementById("aclaracionControls");
        if (acCtrl) acCtrl.classList.add("hidden");

        var panel = document.getElementById("actionPanel");
        if (panel) panel.classList.add("hidden");

        var panelMeaning = document.getElementById("panelMeaningContent");
        if (panelMeaning) panelMeaning.classList.add("hidden");

        var inputPregunta = document.getElementById("tiradaPregunta");
        if (inputPregunta) inputPregunta.value = "";

        setInterpretarFeedback("hidden");
        closeMeaningModal();
        clearReadingState();
      }

      function makeAclaracionCard(card) {
        var div = document.createElement("div");
        div.className = "carta-aclaracion-item";
        div.innerHTML = detailCardHtml(card, " border-amber-300");
        var trigger = div.querySelector(".carta-detail-trigger");
        if (trigger) {
          trigger.dataset.cardId = card.id;
          bindDetailTrigger(trigger);
        }
        return div;
      }

      function revelarTodas() {
        var pendientesBoard = [];
        document
          .querySelectorAll('#boardCardsSurface .tarot-board-card[data-revealed="0"]')
          .forEach(function (el) {
            pendientesBoard.push(el);
          });

        var pendientesGrid = [];
        document
          .querySelectorAll('#cardsContainer .flippable-card[data-revealed="0"]')
          .forEach(function (el) {
            pendientesGrid.push(el);
          });

        if (pendientesBoard.length === 0 && pendientesGrid.length === 0) return;

        pendientesBoard.forEach(function (el, i) {
          setTimeout(function () {
            flipBoardCard(el, true);
          }, i * 150);
        });

        pendientesGrid.forEach(function (el, i) {
          setTimeout(function () {
            revealCard(el);
          }, i * 150);
        });
      }

      function setInterpretarFeedback(state, errorMsg) {
        var wrapper = document.getElementById("interpretarFeedback");
        var elLoad = document.getElementById("interpretarFeedbackLoading");
        var elOk = document.getElementById("interpretarFeedbackOk");
        var elErr = document.getElementById("interpretarFeedbackError");
        var elErrMsg = document.getElementById("interpretarFeedbackErrorMsg");
        var elWarn = document.getElementById("interpretarFeedbackWarn");
        var elWarnMsg = document.getElementById("interpretarFeedbackWarnMsg");

        if (!wrapper) return;

        // ocultar todos los estados internos
        [elLoad, elOk, elErr, elWarn].forEach(function (el) {
          if (el) {
            el.classList.add("hidden");
            el.classList.remove("flex");
          }
        });

        if (state === "hidden") {
          wrapper.classList.add("hidden");
          return;
        }

        wrapper.classList.remove("hidden");

        if (state === "loading" && elLoad) {
          elLoad.classList.remove("hidden");
          elLoad.classList.add("flex");
        } else if (state === "ok" && elOk) {
          elOk.classList.remove("hidden");
          elOk.classList.add("flex");
        } else if (state === "error" && elErr) {
          elErr.classList.remove("hidden");
          elErr.classList.add("flex");
          if (elErrMsg)
            elErrMsg.textContent =
              errorMsg || "Error al generar la interpretación.";
        } else if (state === "warn" && elWarn) {
          elWarn.classList.remove("hidden");
          elWarn.classList.add("flex");
          if (elWarnMsg) elWarnMsg.innerHTML = errorMsg || "Aviso de cuenta.";
        }
      }

      var hasInterpretacion = false;

      function interpretar() {
        var planEl = document.getElementById("user-plan-data");
        var plan = planEl ? planEl.dataset.plan : "free";
        var uid = planEl ? planEl.dataset.uid : "";

        var sessionLimit = 1; // free / Caminante
        if (plan && (plan.indexOf("buscador") !== -1 || plan.indexOf("premium") !== -1)) {
          sessionLimit = 2;
        } else if (plan && plan.indexOf("guia") !== -1) {
          sessionLimit = 3;
        }

        var sessionKey = "apptarot_interpretations_session_count_" + uid;
        var sessionCount = parseInt(sessionStorage.getItem(sessionKey) || "0", 10);

        if (sessionCount >= sessionLimit) {
          setInterpretarFeedback(
            "warn",
            "Has alcanzado el límite de " + sessionLimit + " interpretación(es) con IA por sesión para tu plan " +
            (plan === 'free' ? 'Caminante' : plan.indexOf('guia') !== -1 ? 'Guía Personal' : 'Buscador') +
            '. <a href="/profile" style="color: var(--primary); font-weight: bold; text-decoration: underline;">Actualiza tu plan</a> para obtener interpretaciones ilimitadas.'
          );
          return;
        }

        if (hasInterpretacion) {
          setInterpretarFeedback(
            "warn",
            '¿Deseas una nueva lectura? <a href="/profile" style="color: var(--primary); font-weight: bold; text-decoration: underline;">Actualiza tu plan</a> para obtener interpretaciones ilimitadas, o bien <strong>baraja de nuevo</strong> para reiniciar la tirada.',
          );
          return;
        }
        var cartasReveladas = [];
        document.querySelectorAll('[data-revealed="1"]').forEach(function (el) {
          if (el.dataset.card) {
            try {
              cartasReveladas.push(JSON.parse(el.dataset.card));
            } catch (e) {}
          }
        });

        if (cartasReveladas.length === 0) {
          alert("Primero revela al menos una carta haciendo clic sobre ella.");
          return;
        }

        var content = document.getElementById("interpretacionContent");
        var loading = document.getElementById("interpretacionLoading");
        var texto = document.getElementById("interpretacionTexto");
        var btn = document.getElementById("interpretarBtn");

        // Mostrar feedback inline de carga
        setInterpretarFeedback("loading");
        setActionsDisabled(true);

        if (loading) loading.classList.remove("hidden");
        if (texto) texto.innerHTML = "";
        if (btn) {
          btn.textContent = "Consultando...";
        }

        if (content) content.classList.remove("hidden");
        if (content) content.setAttribute("aria-busy", "true");

        var inputPregunta = document.getElementById("tiradaPregunta");
        var preguntaText = inputPregunta ? inputPregunta.value.trim() : "";

        fetch("/api/interpretar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cartas: cartasReveladas, pregunta: preguntaText }),
        })
          .then(function (res) {
            return res.json();
          })
          .then(function (data) {
            if (loading) loading.classList.add("hidden");
            if (btn) {
              btn.textContent = "✨ Interpretar Tirada";
            }
            if (content) content.setAttribute("aria-busy", "false");
            setActionsDisabled(false);

            if (data.error) {
              if (/iniciar sesi[oó]n/i.test(String(data.error))) {
                setInterpretarFeedback(
                  "error",
                  data.error + " Ve a Mi Perfil para iniciar sesión.",
                );
                return;
              }
              setInterpretarFeedback("error", data.error);
              return;
            }

            if (texto) {
              var lines = (data.interpretacion || "")
                .split("\n")
                .filter(function (l) {
                  return l.trim();
                });
              var displayQuestion = preguntaText || "¿Cuál es la energía actual del consultante?";
              var headerHtml = '<h4 class="text-sm font-semibold mb-3 border-b pb-1" style="color: var(--primary); border-color: var(--border);">Consulta: "' + escapeHtml(displayQuestion) + '"</h4>';
              texto.innerHTML = headerHtml + lines
                .map(function (l) {
                  return '<p class="mb-3 italic">' + escapeHtml(l) + "</p>";
                })
                .join("");
              persistCurrentState();
            }

            hasInterpretacion = true;

            // Increment session interpretation count
            var currentCount = parseInt(sessionStorage.getItem(sessionKey) || "0", 10);
            sessionStorage.setItem(sessionKey, String(currentCount + 1));

            // Actualizar texto del botón toggle
            var closeBtn = document.getElementById("closeInterpretacionBtn");
            if (closeBtn) closeBtn.textContent = "▼ Ocultar";

            setInterpretarFeedback("ok");

            if (data.warning) {
              setTimeout(function () {
                setInterpretarFeedback("warn", data.warning);
              }, 1200);
            }
          })
          .catch(function () {
            if (loading) loading.classList.add("hidden");
            if (btn) {
              btn.textContent = "✨ Interpretar Tirada";
            }
            if (content) content.setAttribute("aria-busy", "false");
            setActionsDisabled(false);
            setInterpretarFeedback(
              "error",
              "Error al contactar el servidor. Inténtalo de nuevo.",
            );
          });
      }

      function aclaracion() {
        var d = getData();
        var menores = shuffle(d.arcanosMenores);
        var card = menores[0];
        if (!card) {
          alert("No hay más arcanos menores disponibles");
          return;
        }

        // 1. Mostrar directamente sobre el tapete de tela interactivo
        var boardSurface = document.getElementById("boardCardsSurface");
        var board = document.getElementById("boardCanvas");
        if (boardSurface && board) {
          var bW = board.clientWidth || 1200;
          var bH = board.clientHeight || 700;

          var pos = calculateAclaracionPosition(aclaracionCountOnBoard, bW, bH);
          aclaracionCountOnBoard++;

          var existingCount = boardSurface.querySelectorAll(".tarot-board-card").length;
          var boardCardEl = makeBoardCard(card, existingCount, existingCount + 1);
          boardCardEl.dataset.isAclaracion = "1";
          boardCardEl.classList.add("is-aclaracion-card");
          boardCardEl.style.left = pos.left + "px";
          boardCardEl.style.top = pos.top + "px";
          boardCardEl.style.transform = "rotate(" + pos.tilt + "deg)";
          boardCardEl.dataset.defaultTilt = pos.tilt.toString();

          // Entrada animada sobre el tapete
          boardCardEl.style.opacity = "0";
          boardCardEl.style.transform = "scale(0.8) rotate(" + pos.tilt + "deg)";
          boardCardEl.style.transition = "opacity 0.35s ease, transform 0.35s cubic-bezier(0.34, 1.35, 0.64, 1)";
          boardSurface.appendChild(boardCardEl);

          setTimeout(function () {
            boardCardEl.style.opacity = "1";
            boardCardEl.style.transform = "scale(1) rotate(" + pos.tilt + "deg)";
            setTimeout(function () {
              boardCardEl.style.transition = "";
            }, 380);
          }, 25);
        }

        // Quitar la carta usada del pool en memoria para no repetir
        d.arcanosMenores = d.arcanosMenores.filter(function (c) {
          return c.id !== card.id;
        });
        persistCurrentState();
      }

      function renderMeaningPanel(card) {
        var panel = document.getElementById("panelMeaningContent");
        var toggleBtn = document.getElementById("toggleMeaningBtn");
        var name = document.getElementById("panelCardName");
        var meta = document.getElementById("panelCardMeta");
        var direct = document.getElementById("panelCardDirect");
        var inverted = document.getElementById("panelCardInverted");
        var link = document.getElementById("panelDetailLink");

        if (!panel) return;
        panel.classList.remove("hidden");
        if (toggleBtn) toggleBtn.textContent = "▼ Ocultar";

        if (name) name.textContent = card.nombre;
        if (meta) {
          var id = identifier(card);
          var label = card.arcano === "mayor" ? "Arcano Mayor" : "Arcano Menor";
          meta.textContent = (id ? id + " · " : "") + label;
        }
        if (direct)
          direct.innerHTML =
            "<strong>Directo:</strong> " +
            escapeHtml(
              card.significado && card.significado.directo
                ? card.significado.directo
                : "No disponible",
            );
        if (inverted)
          inverted.innerHTML =
            "<strong>Invertido:</strong> " +
            escapeHtml(
              card.significado && card.significado.invertido
                ? card.significado.invertido
                : "No disponible",
            );
        if (link)
          link.href =
            "/cards/" +
            card.id +
            "?returnTo=" +
            encodeURIComponent("/cards/random-cards");
      }

      function openMeaning(cardId) {
        var card = getCardById(cardId);
        if (!card) return;

        var sidePanel = document.getElementById("cardMeaningPanel");
        var canUsePanel =
          sidePanel && window.matchMedia("(min-width: 1280px)").matches;
        if (canUsePanel) {
          renderMeaningPanel(card);
          return;
        }

        openMeaningModal(cardId);
      }

      function openMeaningModal(cardId) {
        var card = getCardById(cardId);
        if (!card) return;

        var modal = document.getElementById("cardMeaningModal");
        var title = document.getElementById("modalCardName");
        var image = document.getElementById("modalCardImage");
        var meta = document.getElementById("modalCardMeta");
        var direct = document.getElementById("modalCardDirect");
        var inverted = document.getElementById("modalCardInverted");
        var symbols = document.getElementById("modalCardSymbols");
        var detailLink = document.getElementById("modalDetailLink");

        if (title) title.textContent = card.nombre;
        if (image) {
          image.src = buildSrc(card.imagem);
          image.alt = "Carta " + card.nombre;
          image.onerror = function () {
            this.onerror = null;
            this.src = DEFAULT_IMAGE;
          };
        }

        if (meta) {
          var id = identifier(card);
          var label = card.arcano === "mayor" ? "Arcano Mayor" : "Arcano Menor";
          meta.textContent = (id ? id + " · " : "") + label;
        }

        if (direct)
          direct.textContent =
            card.significado && card.significado.directo
              ? card.significado.directo
              : "No disponible";
        if (inverted)
          inverted.textContent =
            card.significado && card.significado.invertido
              ? card.significado.invertido
              : "No disponible";

        if (symbols) {
          var symbolsList =
            card.simbolos && card.simbolos.principales
              ? card.simbolos.principales
              : [];
          symbols.innerHTML = symbolsList.length
            ? symbolsList
                .map(function (s) {
                  return "<li>" + escapeHtml(s) + "</li>";
                })
                .join("")
            : "<li>No hay símbolos registrados.</li>";
        }

        if (detailLink) {
          detailLink.href =
            "/cards/" +
            card.id +
            "?returnTo=" +
            encodeURIComponent("/cards/random-cards");
        }

        if (modal) {
          modal.classList.remove("hidden");
          modal.setAttribute("aria-hidden", "false");
          document.body.classList.add("overflow-hidden");
        }
      }

      function closeMeaningModal() {
        var modal = document.getElementById("cardMeaningModal");
        if (!modal) return;
        modal.classList.add("hidden");
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("overflow-hidden");
      }

      function setupMeaningModalEvents() {
        var closeBtn = document.getElementById("closeMeaningModalBtn");
        if (closeBtn) closeBtn.addEventListener("click", closeMeaningModal);

        var backdrop = document.getElementById("cardMeaningBackdrop");
        if (backdrop) backdrop.addEventListener("click", closeMeaningModal);

        document.addEventListener("keydown", function (ev) {
          if (ev.key === "Escape") closeMeaningModal();
        });
      }

      function restoreReadingState() {
        var state = loadReadingState();
        if (
          !state ||
          !Array.isArray(state.selectedIds) ||
          state.selectedIds.length === 0
        )
          return;

        if (state.mode) {
          var modeInput = document.querySelector(
            'input[name="tiradaMode"][value="' + state.mode + '"]',
          );
          if (modeInput) modeInput.checked = true;
        }

        var countEl = document.getElementById("cardCount");
        if (countEl && state.count) countEl.value = String(state.count);

        var selectedCards = state.selectedIds
          .map(getCardById)
          .filter(function (card) {
            return !!card;
          });
        if (selectedCards.length === 0) {
          clearReadingState();
          return;
        }

        var container = document.getElementById("cardsContainer");
        if (container) container.innerHTML = "";

        var boardSurface = document.getElementById("boardCardsSurface");
        if (boardSurface) boardSurface.innerHTML = "";

        var boardMsg = document.getElementById("boardInitialMessage");
        if (boardMsg) boardMsg.classList.add("hidden");

        selectedCards.forEach(function (card, i) {
          var cardEl = makeCard(card);
          if (container) container.appendChild(cardEl);

          var boardCardEl = makeBoardCard(card, i, selectedCards.length);
          if (boardSurface) boardSurface.appendChild(boardCardEl);

          if (
            Array.isArray(state.revealedIds) &&
            state.revealedIds.indexOf(card.id) >= 0
          ) {
            revealCard(cardEl, true);
            flipBoardCard(boardCardEl, true);
          }
        });

        var acCtrl = document.getElementById("aclaracionControls");
        if (acCtrl) acCtrl.classList.remove("hidden");

        var panel = document.getElementById("actionPanel");
        if (panel) panel.classList.remove("hidden");

        if (
          Array.isArray(state.aclaracionIds) &&
          state.aclaracionIds.length > 0
        ) {
          state.aclaracionIds.forEach(function (id, aclIdx) {
            var card = getCardById(id);
            if (!card) return;

            if (boardSurface) {
              var bCanvas = document.getElementById("boardCanvas");
              var bW = bCanvas ? bCanvas.clientWidth : 1200;
              var bH = bCanvas ? bCanvas.clientHeight : 700;
              var pos = calculateAclaracionPosition(aclIdx, bW, bH);
              aclaracionCountOnBoard = aclIdx + 1;

              var existingCount = boardSurface.querySelectorAll(".tarot-board-card").length;
              var aclBoardCard = makeBoardCard(card, existingCount, existingCount + 1);
              aclBoardCard.dataset.isAclaracion = "1";
              aclBoardCard.classList.add("is-aclaracion-card");
              aclBoardCard.style.left = pos.left + "px";
              aclBoardCard.style.top = pos.top + "px";
              aclBoardCard.style.transform = "rotate(" + pos.tilt + "deg)";
              boardSurface.appendChild(aclBoardCard);

              if (Array.isArray(state.revealedIds) && state.revealedIds.indexOf(card.id) !== -1) {
                flipBoardCard(aclBoardCard, true);
              }
            }
          });

          var d = getData();
          d.arcanosMenores = d.arcanosMenores.filter(function (c) {
            return state.aclaracionIds.indexOf(c.id) === -1;
          });
        }

        var interpContent = document.getElementById("interpretacionContent");
        var interpTxt = document.getElementById("interpretacionTexto");
        if (interpTxt && state.interpretacionHtml) {
          interpTxt.innerHTML = state.interpretacionHtml;
          if (interpContent) interpContent.classList.remove("hidden");
        }

        var inputPregunta = document.getElementById("tiradaPregunta");
        if (inputPregunta && state.pregunta) {
          inputPregunta.value = state.pregunta;
        }

        setHasActiveReading(true);
        setFocusMode(false);
      }

      function init() {
        var btnBarajar = document.getElementById("generateBtn");
        if (btnBarajar) btnBarajar.addEventListener("click", barajar);

        var btnLimpiar = document.getElementById("resetBtn");
        if (btnLimpiar) btnLimpiar.addEventListener("click", limpiar);

        // Controles del Tablero Interactivo con Paño de Tela
        var clothSelect = document.getElementById("clothThemeSelect");
        var boardCanvas = document.getElementById("boardCanvas");
        if (clothSelect && boardCanvas) {
          var hasBuscador = clothSelect.dataset.hasBuscador === "true";

          try {
            var savedCloth = localStorage.getItem("tarot_board_cloth");
            if (savedCloth) {
              if (savedCloth === "cloth-violeta" || hasBuscador) {
                clothSelect.value = savedCloth;
                boardCanvas.className = "tarot-board-canvas " + savedCloth;
              } else {
                clothSelect.value = "cloth-violeta";
                boardCanvas.className = "tarot-board-canvas cloth-violeta";
              }
            }
          } catch (e) {}

          clothSelect.addEventListener("change", function () {
            var val = clothSelect.value;
            if (val !== "cloth-violeta" && !hasBuscador) {
              clothSelect.value = "cloth-violeta";
              boardCanvas.className = "tarot-board-canvas cloth-violeta";
              alert("Los paños personalizados son exclusivos de la Membresía Buscador. Actualiza tu plan para desbloquear todos los tapetes.");
              return;
            }
            boardCanvas.className = "tarot-board-canvas " + val;
            try {
              localStorage.setItem("tarot_board_cloth", val);
            } catch (e) {}
          });
        }

        var btnViewBoard = document.getElementById("viewModeBoardBtn");
        var btnViewGrid = document.getElementById("viewModeGridBtn");
        var cardsContainer = document.getElementById("cardsContainer");

        if (btnViewBoard && btnViewGrid && boardCanvas && cardsContainer) {
          btnViewBoard.addEventListener("click", function () {
            boardCanvas.classList.remove("hidden");
            cardsContainer.classList.add("hidden");
            btnViewBoard.className = "px-2.5 py-1 rounded-md font-medium text-amber-300 bg-slate-800 transition-all cursor-pointer";
            btnViewGrid.className = "px-2.5 py-1 rounded-md font-medium text-slate-400 hover:text-slate-200 transition-all cursor-pointer";
          });

          btnViewGrid.addEventListener("click", function () {
            boardCanvas.classList.add("hidden");
            cardsContainer.classList.remove("hidden");
            btnViewGrid.className = "px-2.5 py-1 rounded-md font-medium text-amber-300 bg-slate-800 transition-all cursor-pointer";
            btnViewBoard.className = "px-2.5 py-1 rounded-md font-medium text-slate-400 hover:text-slate-200 transition-all cursor-pointer";
          });
        }

        var btnBoardFlipAll = document.getElementById("boardFlipAllBtn");
        if (btnBoardFlipAll) {
          btnBoardFlipAll.addEventListener("click", revelarTodas);
        }

        var btnBoardReorganize = document.getElementById("boardReorganizeBtn");
        if (btnBoardReorganize) {
          btnBoardReorganize.addEventListener("click", reorganizeBoardCards);
        }

        var btnBoardClear = document.getElementById("boardClearBtn");
        if (btnBoardClear) {
          btnBoardClear.addEventListener("click", limpiar);
        }

        var inputPregunta = document.getElementById("tiradaPregunta");
        if (inputPregunta) {
          inputPregunta.addEventListener("input", persistCurrentState);
        }

        var btnAclaracion = document.getElementById("aclaracionBtn");
        if (btnAclaracion) btnAclaracion.addEventListener("click", aclaracion);

        var btnRevelarTodas = document.getElementById("revelarTodasBtn");
        if (btnRevelarTodas)
          btnRevelarTodas.addEventListener("click", revelarTodas);

        var btnToggleMeaning = document.getElementById("toggleMeaningBtn");
        if (btnToggleMeaning) {
          btnToggleMeaning.addEventListener("click", function () {
            var content = document.getElementById("panelMeaningContent");
            if (!content) return;
            var isHidden = content.classList.contains("hidden");
            content.classList.toggle("hidden");
            btnToggleMeaning.textContent = isHidden
              ? "▼ Ocultar"
              : "▶ Ver significado";
          });
        }

        var btnInterpretar = document.getElementById("interpretarBtn");
        if (btnInterpretar)
          btnInterpretar.addEventListener("click", interpretar);

        var btnScrollInterp = document.getElementById("interpretarScrollBtn");
        if (btnScrollInterp) {
          btnScrollInterp.addEventListener("click", function () {
            var sec = document.getElementById("interpretacionSection");
            if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        }

        var btnCloseInterp = document.getElementById("closeInterpretacionBtn");
        if (btnCloseInterp) {
          btnCloseInterp.addEventListener("click", function () {
            var content = document.getElementById("interpretacionContent");
            if (!content) return;
            var isHidden = content.classList.contains("hidden");
            content.classList.toggle("hidden");
            btnCloseInterp.textContent = isHidden
              ? "▼ Ocultar"
              : "▶ Ver interpretación";
          });
        }
        var btnCopiarInterp = document.getElementById(
          "copiarInterpretacionBtn",
        );
        if (btnCopiarInterp) {
          btnCopiarInterp.addEventListener("click", function () {
            var txt = document.getElementById("interpretacionTexto");
            if (!txt || !txt.textContent) {
              alert("No hay interpretación para copiar");
              return;
            }
            var text = txt.textContent;
            navigator.clipboard
              .writeText(text)
              .then(function () {
                var old = btnCopiarInterp.textContent;
                btnCopiarInterp.textContent = "✓ Copiado";
                setTimeout(function () {
                  btnCopiarInterp.textContent = old;
                }, 1500);
              })
              .catch(function () {
                alert("No se pudo copiar al portapapeles");
              });
          });
        }

        var btnGuardarInterp = document.getElementById(
          "guardarInterpretacionBtn",
        );
        if (btnGuardarInterp) {
          btnGuardarInterp.addEventListener("click", function () {
            var txt = document.getElementById("interpretacionTexto");
            if (!txt || !txt.textContent) {
              alert("No hay interpretación para guardar");
              return;
            }

            var cartasReveladas = [];
            document
              .querySelectorAll("#boardCardsSurface [data-card], #cardsContainer [data-card]")
              .forEach(function (el) {
                try {
                  var card = JSON.parse(el.dataset.card || "{}");
                  if (el.dataset.revealed === "1" && !cartasReveladas.some(function(c) { return c.id === card.id; }))
                    cartasReveladas.push(card);
                } catch (e) {}
              });

            if (cartasReveladas.length === 0) {
              alert("Primero revela al menos una carta");
              return;
            }

            var modeEl = document.querySelector(
              'input[name="tiradaMode"]:checked',
            );
            var mode = modeEl ? modeEl.value : "mixta";
            var interpretacion = txt.textContent;

            btnGuardarInterp.disabled = true;
            btnGuardarInterp.textContent = "Guardando...";

            var inputPregunta = document.getElementById("tiradaPregunta");
            var preguntaText = inputPregunta ? inputPregunta.value.trim() : "";
            if (!preguntaText) {
              preguntaText = "¿Cuál es la energía actual del consultante?";
            }

            var planEl = document.getElementById("user-plan-data");
            var currentCount = parseInt(planEl ? planEl.dataset.count : "0", 10) || 0;

            fetch("/api/readings/save", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                cards: cartasReveladas,
                mode: mode,
                interpretation: interpretacion,
                pregunta: preguntaText,
                date: new Date().toISOString(),
              }),
            })
              .then(function (res) {
                return res.json();
              })
              .then(function (data) {
                if (data.ok) {
                  if (planEl) {
                    planEl.dataset.count = String(currentCount + 1);
                  }
                  var old = btnGuardarInterp.textContent;
                  btnGuardarInterp.textContent = "✓ Guardado";
                  setTimeout(function () {
                    btnGuardarInterp.textContent = old;
                    btnGuardarInterp.disabled = false;
                  }, 1500);
                } else {
                  throw new Error(data.error || "Error desconocido");
                }
              })
              .catch(function (err) {
                alert(
                  "Error al guardar: " +
                    (err instanceof Error ? err.message : "Error desconocido"),
                );
                btnGuardarInterp.textContent = "💾 Guardar";
                btnGuardarInterp.disabled = false;
              });
          });
        }

        var btnGuardarSinInterp = document.getElementById("guardarTiradaSinInterpBtn");
        if (btnGuardarSinInterp) {
          btnGuardarSinInterp.addEventListener("click", function () {
            var planEl = document.getElementById("user-plan-data");
            var currentCount = parseInt(planEl ? planEl.dataset.count : "0", 10) || 0;
            var limit = parseInt(planEl ? planEl.dataset.limit : "3", 10) || 3;
            var remaining = limit - currentCount;

            if (remaining <= 0) {
              alert("Has alcanzado el límite de " + limit + " tiradas de tu plan. No puedes guardar más tiradas.");
              return;
            }

            var confirmMsg = "La tirada se guardará sin interpretación de IA.\n" +
              "Te quedan " + remaining + " tiradas por guardar de tu límite de " + limit + ".\n" +
              "¿Deseas continuar?";
            
            if (!window.confirm(confirmMsg)) {
              return;
            }

            var cartasReveladas = [];
            document
              .querySelectorAll("#boardCardsSurface [data-card], #cardsContainer [data-card]")
              .forEach(function (el) {
                try {
                  var card = JSON.parse(el.dataset.card || "{}");
                  if (el.dataset.revealed === "1" && !cartasReveladas.some(function(c) { return c.id === card.id; }))
                    cartasReveladas.push(card);
                } catch (e) {}
              });

            if (cartasReveladas.length === 0) {
              alert("Primero revela al menos una carta");
              return;
            }

            var modeEl = document.querySelector('input[name="tiradaMode"]:checked');
            var mode = modeEl ? modeEl.value : "mixta";
            var inputPregunta = document.getElementById("tiradaPregunta");
            var preguntaText = inputPregunta ? inputPregunta.value.trim() : "";
            if (!preguntaText) {
              preguntaText = "¿Cuál es la energía actual del consultante?";
            }

            btnGuardarSinInterp.disabled = true;
            btnGuardarSinInterp.textContent = "Guardando...";

            fetch("/api/readings/save", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                cards: cartasReveladas,
                mode: mode,
                interpretation: "Tirada guardada sin interpretación de IA.",
                pregunta: preguntaText,
                date: new Date().toISOString(),
              }),
            })
              .then(function (res) {
                return res.json();
              })
              .then(function (data) {
                if (data.ok) {
                  if (planEl) {
                    planEl.dataset.count = String(currentCount + 1);
                  }
                  btnGuardarSinInterp.textContent = "✓ Guardado";
                  setTimeout(function () {
                    btnGuardarSinInterp.textContent = "💾 Guardar Tirada (Sin IA)";
                    btnGuardarSinInterp.disabled = false;
                  }, 1500);
                } else {
                  throw new Error(data.error || "Error desconocido");
                }
              })
              .catch(function (err) {
                alert(
                  "Error al guardar: " +
                    (err instanceof Error ? err.message : "Error desconocido"),
                );
                btnGuardarSinInterp.textContent = "💾 Guardar Tirada (Sin IA)";
                btnGuardarSinInterp.disabled = false;
              });
          });
        }

        setupMeaningModalEvents();

        // Limpiar estado de lectura anterior si es la primera carga de esta sesión
        var sessionMarker = "apptarot_reading_session_loaded";
        if (!sessionStorage.getItem(sessionMarker)) {
          clearReadingState();
          sessionStorage.setItem(sessionMarker, "1");
        }

        restoreReadingState();
      }

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
      } else {
        init();
      }
    })();