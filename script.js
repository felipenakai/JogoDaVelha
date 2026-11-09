 /* ==========================================================================
           1. ESTADO DO JOGO E VARIÁVEIS DE CONFIGURAÇÃO
           ========================================================================== */
        let board = ['', '', '', '', '', '', '', '', ''];
        let currentPlayer = 'X';
        let isGameActive = true;
        
        let gameMode = 'pvp';        // 'pvp' (2 Jogadores) ou 'ai' (Contra IA)
        let playerSymbol = 'X';      // Símbolo do jogador humano na IA ('X' ou 'O')
        let aiSymbol = 'O';          // Símbolo da IA ('O' ou 'X')
        let aiDifficulty = 'hard';   // 'easy', 'medium', 'hard'

        let scores = { X: 0, O: 0, ties: 0 };

        // Combinações de Vitória
        const winConditions = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Horizontais
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Verticais
            [0, 4, 8], [2, 4, 6]              // Diagonais
        ];

        /* ==========================================================================
           2. INICIALIZAÇÃO E PERSISTÊNCIA (LOCALSTORAGE)
           ========================================================================== */
        window.onload = () => {
            loadScores();
            updateUIState();
            resetGame(true);
        };

        function loadScores() {
            const saved = localStorage.getItem('tictactoe_pure_scores');
            if (saved) {
                try {
                    scores = JSON.parse(saved);
                } catch (e) {
                    scores = { X: 0, O: 0, ties: 0 };
                }
            }
            updateScoreboardUI();
        }

        function saveScores() {
            localStorage.setItem('tictactoe_pure_scores', JSON.stringify(scores));
        }

        function resetScores() {
            scores = { X: 0, O: 0, ties: 0 };
            saveScores();
            updateScoreboardUI();
        }

        function updateScoreboardUI() {
            document.getElementById('score-x').innerText = scores.X;
            document.getElementById('score-o').innerText = scores.O;
            document.getElementById('score-ties').innerText = scores.ties;
        }

        /* ==========================================================================
           3. SELEÇÃO DE MODOS E CONFIGURAÇÕES DE INTERFACE
           ========================================================================== */
        function setMode(mode) {
            if (gameMode === mode) return;
            gameMode = mode;

            document.getElementById('btn-pvp').classList.toggle('active', mode === 'pvp');
            document.getElementById('btn-ai').classList.toggle('active', mode === 'ai');
            document.getElementById('ai-options').classList.toggle('hidden', mode === 'pvp');

            updateLabels();
            resetGame(true);
        }

        function setSymbol(symbol) {
            if (playerSymbol === symbol) return;
            playerSymbol = symbol;
            aiSymbol = symbol === 'X' ? 'O' : 'X';

            document.getElementById('sym-x').classList.toggle('active', symbol === 'X');
            document.getElementById('sym-o').classList.toggle('active', symbol === 'O');

            updateLabels();
            resetGame(true);
        }

        function setDifficulty(diff) {
            aiDifficulty = diff;
            document.getElementById('diff-easy').classList.toggle('active', diff === 'easy');
            document.getElementById('diff-medium').classList.toggle('active', diff === 'medium');
            document.getElementById('diff-hard').classList.toggle('active', diff === 'hard');
            if (gameMode === 'ai') resetGame(false);
        }

        function updateLabels() {
            const labelX = document.getElementById('label-x');
            const labelO = document.getElementById('label-o');

            if (gameMode === 'pvp') {
                labelX.innerText = 'Jogador X';
                labelO.innerText = 'Jogador O';
            } else {
                if (playerSymbol === 'X') {
                    labelX.innerText = 'Você (X)';
                    labelO.innerText = 'IA (O)';
                } else {
                    labelX.innerText = 'IA (X)';
                    labelO.innerText = 'Você (O)';
                }
            }
        }

        function updateUIState() {
            const turnIndicator = document.getElementById('turn-indicator');
            const cardX = document.getElementById('score-card-x');
            const cardO = document.getElementById('score-card-o');

            // Atualiza destaque no placar
            cardX.classList.toggle('active-turn', currentPlayer === 'X');
            cardO.classList.toggle('active-turn', currentPlayer === 'O');

            // Atualiza texto de status
            turnIndicator.innerText = currentPlayer;
            turnIndicator.className = `turn-badge ${currentPlayer.toLowerCase()}`;

            const banner = document.getElementById('status-banner');
            let text = "Vez de:";
            if (gameMode === 'ai') {
                text = currentPlayer === playerSymbol ? "Sua vez:" : "Vez da IA:";
            }
            banner.children[0].innerText = text;
        }

        /* ==========================================================================
           4. FLUXO DO JOGO E JOGADAS
           ========================================================================== */
        function handleCellClick(index) {
            // Bloqueia clique se célula já tiver símbolo ou se jogo não estiver ativo
            if (board[index] !== '' || !isGameActive) return;

            // Bloqueia clique se for o turno da IA
            if (gameMode === 'ai' && currentPlayer === aiSymbol) return;

            executeMove(index, currentPlayer);

            if (checkEndGame()) return;

            // Dispara jogada da IA se for o turno dela
            if (gameMode === 'ai' && isGameActive && currentPlayer === aiSymbol) {
                triggerAIMove();
            }
        }

        function executeMove(index, symbol) {
            board[index] = symbol;
            const cell = document.getElementById(`cell-${index}`);
            
            cell.innerText = symbol;
            cell.classList.add('taken', symbol === 'X' ? 'symbol-x' : 'symbol-o');
        }

        function checkEndGame() {
            const winningLine = checkWin(board, currentPlayer);

            if (winningLine) {
                handleWin(currentPlayer, winningLine);
                return true;
            }

            if (checkTie(board)) {
                handleTie();
                return true;
            }

            // Alterna turno
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            updateUIState();
            return false;
        }

        function triggerAIMove() {
            // Desabilita interação temporária
            isGameActive = false;
            
            // Pequeno atraso para simular o "pensamento" da IA
            setTimeout(() => {
                isGameActive = true;
                const bestMove = calculateAIMove();
                executeMove(bestMove, aiSymbol);

                if (!checkEndGame()) {
                    // Turno volta para o jogador
                }
            }, 400);
        }

        /* ==========================================================================
           5. FINALIZAÇÃO DA PARTIDA E MODAIS
           ========================================================================== */
        function handleWin(winner, line) {
            isGameActive = false;
            scores[winner]++;
            saveScores();
            updateScoreboardUI();

            // Destaque visual na linha vencedora
            line.forEach(index => {
                const cell = document.getElementById(`cell-${index}`);
                cell.classList.add(winner === 'X' ? 'winner-x' : 'winner-o');
            });

            // Exibir Modal
            setTimeout(() => {
                let winnerText = `Jogador ${winner} Venceu!`;
                if (gameMode === 'ai') {
                    winnerText = winner === playerSymbol ? 'Você Venceu! 🎉' : 'A IA Venceu! 🤖';
                }

                showModal('Vitória!', winnerText);
                if (gameMode === 'pvp' || winner === playerSymbol) {
                    createConfetti();
                }
            }, 500);
        }

        function handleTie() {
            isGameActive = false;
            scores.ties++;
            saveScores();
            updateScoreboardUI();

            setTimeout(() => {
                showModal('Empate!', 'Ninguém venceu esta partida.');
            }, 400);
        }

        function showModal(title, subtitle) {
            document.getElementById('modal-title').innerText = title;
            document.getElementById('modal-subtitle').innerText = subtitle;
            document.getElementById('result-modal').classList.add('active');
        }

        function closeModal() {
            document.getElementById('result-modal').classList.remove('active');
            resetGame(false);
        }

        function resetGame(fullReset = false) {
            board = ['', '', '', '', '', '', '', '', ''];
            currentPlayer = 'X';
            isGameActive = true;

            // Limpa tabuleiro
            for (let i = 0; i < 9; i++) {
                const cell = document.getElementById(`cell-${i}`);
                cell.innerText = '';
                cell.className = 'cell';
            }

            updateUIState();

            // Se for modo IA e a IA for 'X', ela faz o primeiro movimento
            if (gameMode === 'ai' && playerSymbol === 'O') {
                triggerAIMove();
            }
        }

        /* ==========================================================================
           6. ALGORITMOS DE IA (FÁCIL, MÉDIO E MINIMAX IMPOSSÍVEL)
           ========================================================================== */
        function checkWin(boardState, player) {
            for (let condition of winConditions) {
                const [a, b, c] = condition;
                if (boardState[a] === player && boardState[b] === player && boardState[c] === player) {
                    return condition;
                }
            }
            return null;
        }

        function checkTie(boardState) {
            return boardState.every(cell => cell !== '');
        }

        function calculateAIMove() {
            const availableSpots = board.map((val, idx) => val === '' ? idx : null).filter(val => val !== null);

            // Nível Fácil
            if (aiDifficulty === 'easy') {
                return availableSpots[Math.floor(Math.random() * availableSpots.length)];
            }

            // Nível Médio (50% Minimax / 50% Aleatório)
            if (aiDifficulty === 'medium') {
                if (Math.random() > 0.5) {
                    return minimax(board, aiSymbol).index;
                } else {
                    return availableSpots[Math.floor(Math.random() * availableSpots.length)];
                }
            }

            // Nível Impossível (Minimax)
            return minimax(board, aiSymbol).index;
        }

        function minimax(newBoard, player) {
            const availSpots = newBoard.map((val, idx) => val === '' ? idx : null).filter(val => val !== null);

            // Condições Finais do Minimax
            if (checkWin(newBoard, playerSymbol)) {
                return { score: -10 };
            } else if (checkWin(newBoard, aiSymbol)) {
                return { score: 10 };
            } else if (availSpots.length === 0) {
                return { score: 0 };
            }

            const moves = [];

            for (let i = 0; i < availSpots.length; i++) {
                const move = {};
                move.index = availSpots[i];
                newBoard[availSpots[i]] = player;

                if (player === aiSymbol) {
                    const result = minimax(newBoard, playerSymbol);
                    move.score = result.score;
                } else {
                    const result = minimax(newBoard, aiSymbol);
                    move.score = result.score;
                }

                newBoard[availSpots[i]] = '';
                moves.push(move);
            }

            let bestMove;
            if (player === aiSymbol) {
                let bestScore = -10000;
                for (let i = 0; i < moves.length; i++) {
                    if (moves[i].score > bestScore) {
                        bestScore = moves[i].score;
                        bestMove = i;
                    }
                }
            } else {
                let bestScore = 10000;
                for (let i = 0; i < moves.length; i++) {
                    if (moves[i].score < bestScore) {
                        bestScore = moves[i].score;
                        bestMove = i;
                    }
                }
            }

            return moves[bestMove];
        }

        /* ==========================================================================
           7. ANIMAÇÃO DE CONFETES COM CSS/JS PURO
           ========================================================================== */
        function createConfetti() {
            const container = document.getElementById('confetti-container');
            container.innerHTML = '';
            const colors = ['#38bdf8', '#f43f5e', '#8b5cf6', '#f59e0b', '#10b981'];

            for (let i = 0; i < 40; i++) {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + 'vw';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animationDuration = (Math.random() * 2 + 1.5) + 's';
                confetti.style.animationDelay = (Math.random() * 0.3) + 's';
                container.appendChild(confetti);
            }

            setTimeout(() => {
                container.innerHTML = '';
            }, 3000);
        }