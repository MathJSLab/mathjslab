clear % clear all variables

%% =========================
% PARTE 1 — INDEXAÇÃO À DIREITA (RHS)
%% =========================

% Base (já existentes + extensões)

% 1
a = [10,20,30,40]
b = a(2)
test_rhs(1,1) = (b == 20)

% 2
b = a([1,3])
test_rhs(2,1) = all(b == [10,30])

% 3
b = a(2:4)
test_rhs(3,1) = all(b == [20,30,40])

% 4
b = a(1:2:4)
test_rhs(4,1) = all(b == [10,30])

% 5
b = a(a>20)
test_rhs(5,1) = all(b == [30,40])

% 6 (linear em matriz)
A = [1 2;3 4]
b = A(3)
test_rhs(6,1) = (b == 2)

% 7
b = A(2,1)
test_rhs(7,1) = (b == 3)

% 8
A = [1 2 3;4 5 6]
b = A(1,:)
test_rhs(8,1) = all(b == [1 2 3])

% 9
b = A(:,2)
test_rhs(9,1) = all(b == [2;5])

% 10
A = [1 2 3;4 5 6;7 8 9]
b = A(1:2,2:3)
test_rhs(10,1) = all(all(b == [2 3;5 6]))

% 11
b = A(2,[1 3])
test_rhs(11,1) = all(b == [4 6])

% 12 (: linear)
A = [1 2;3 4]
b = A(:)
test_rhs(12,1) = all(b == [1;3;2;4])

% 13 chaining
a = [10,20,30,40]
b = a(2:4)
c = b(2)
test_rhs(13,1) = (c == 30)

% 14 expression index
i = 2
b = a(i+1)
test_rhs(14,1) = (b == 30)

% =========================
% 3D TESTES (CRÍTICOS)
% =========================

A = cat(3,[1 2 3;4 5 6;7 8 9],[10 11 12;13 14 15;16 17 18])

% 15 linear
b = A(2)
test_rhs(15,1) = (b == 4)

% 16 coluna global (flatten parcial)
b = A(:,3)
test_rhs(16,1) = all(b == [3;6;9])

% 17 linha global (folding)
b = A(2,:)
test_rhs(17,1) = all(b == [4 5 6 13 14 15])

% 18 sem folding
b = A(2,:,:)
test_rhs(18,1) = all(b(:) == [4;5;6;13;14;15])

% 19 página
b = A(:,:,2)
test_rhs(19,1) = all(all(b == [10 11 12;13 14 15;16 17 18]))

% =========================
% 4D TESTE BÁSICO
% =========================

B = cat(4, A, A)

% 20
b = B(2,:,:,:)
test_rhs(20,1) = (length(b(:)) == 12)

% =========================
% ERRO
% =========================

a = [1 2 3]
a(10) % error
test_rhs(21,1) = true

% =========================
% RHS COM END
% =========================

a = [10 20 30 40]

% 22
b = a(2:end)
test_rhs(22,1) = all(b == [20 30 40])

% 23
b = a(1:end-1)
test_rhs(23,1) = all(b == [10 20 30])

% 24
b = a(end)
test_rhs(24,1) = (b == 40)

% 25
b = a(end-2:end)
test_rhs(25,1) = all(b == [20 30 40])

% =========================
% MATRIZ 2D
% =========================

A = [1 2 3;4 5 6;7 8 9]

% 26
b = A(2:end,2:end)
test_rhs(26,1) = all(all(b == [5 6;8 9]))

% 27
b = A(:,end)
test_rhs(27,1) = all(b == [3;6;9])

% 28
b = A(end,:)
test_rhs(28,1) = all(b == [7 8 9])

% =========================
% 3D
% =========================

A = cat(3,[1 2 3;4 5 6;7 8 9],[10 11 12;13 14 15;16 17 18])

% 29
b = A(:,:,end)
test_rhs(29,1) = all(all(b == [10 11 12;13 14 15;16 17 18]))

% 30
b = A(2,:,end)
test_rhs(30,1) = all(b == [13 14 15])

% 31
b = A(end,:,1)
test_rhs(31,1) = all(b == [7 8 9])

% 32 orientação row preservada
a = [10 20 30 40]
b = a(a > 20)
test_rhs(32,1) = all(b == [30 40])

% 33 orientação column preservada
a = [10;20;30;40]
b = a(a > 20)
test_rhs(33,1) = all(b == [30;40])

% 34 máscara linha em matriz → resultado linha
A = [1 2;3 4]
mask = [true false true false]
b = A(mask)
test_rhs(34,1) = all(b == [1 2])

% 35 máscara matriz → resultado coluna
mask = [true false; false true]
b = A(mask)
test_rhs(35,1) = all(b == [1;4])

complete_test_result_index_rhs = all(test_rhs)

%% =========================
% PARTE 2 — INDEXAÇÃO À ESQUERDA (LHS)
%% =========================

% 1
a = [10 20 30 40]
a(2) = 99
test_lhs(1,1) = all(a == [10 99 30 40])

% 2
a([1 3]) = [7 8]
test_lhs(2,1) = all(a == [7 99 8 40])

% 3
a(2:3) = [1 2]
test_lhs(3,1) = all(a == [7 1 2 40])

% 4 broadcasting
a(1:3) = 5
test_lhs(4,1) = all(a == [5 5 5 40])

% 5 matriz
A = [1 2;3 4]
A(2,1) = 9
test_lhs(5,1) = all(all(A == [1 2;9 4]))

% 6 linha
A(1,:) = [7 8]
test_lhs(6,1) = all(all(A == [7 8;9 4]))

% 7 coluna
A(:,2) = [1;2]
test_lhs(7,1) = all(all(A == [7 1;9 2]))

% =========================
% 3D LHS
% =========================

A = cat(3,[1 2 3;4 5 6;7 8 9],[10 11 12;13 14 15;16 17 18])

% 8
A(2,:) = [1 2 3 4 5 6]
test_lhs(8,1) = (A(2,1) == 1)

% 9
A(:,3) = 0
test_lhs(9,1) = (A(1,3) == 0)

% =========================
% EXPANSÃO
% =========================

a = [1 2 3]
a(5) = 10
test_lhs(10,1) = (a(5) == 10)

% =========================
% LHS COM END
% =========================

a = [10 20 30 40]

% 11
a(end) = 99
test_lhs(11,1) = (a(4) == 99)

% 12
a(2:end) = [1 2 3]
test_lhs(12,1) = all(a == [10 1 2 3])

% 13 broadcast
a(1:end-1) = 0
test_lhs(13,1) = all(a == [0 0 0 3])

% =========================
% MATRIZ 2D
% =========================

A = [1 2 3;4 5 6;7 8 9]

% 14
A(:,end) = 0
test_lhs(14,1) = all(all(A == [1 2 0;4 5 0;7 8 0]))

% 15
A(end,:) = [9 9 9]
test_lhs(15,1) = all(all(A(3,:) == [9 9 9]))

% =========================
% 3D
% =========================

A = cat(3,[1 2 3;4 5 6;7 8 9],[10 11 12;13 14 15;16 17 18])

% 16
A(:,:,end) = 0
test_lhs(16,1) = (A(1,1,2) == 0)

% 17 logical row assign
a = [1 2 3 4]
a(a > 2) = 9
test_lhs(17,1) = all(a == [1 2 9 9])

% 18 logical column assign
a = [1;2;3;4]
a(a > 2) = 9
test_lhs(18,1) = all(a == [1;2;9;9])

% 19 logical broadcasting matriz
A = [1 2;3 4]
A(A > 2) = 7
test_lhs(19,1) = all(all(A == [1 2;7 7]))

% 20 logical index com vetor RHS
A = [1 2;3 4]
A(A > 2) = [10 20]
test_lhs(20,1) = all(all(A == [1 2;10 20]))

complete_test_result_index_lhs = all(test_lhs)

%% =========================
% PARTE 3 — DELEÇÃO
%% =========================

% 1 vetor
a = [10 20 30 40]
a(2) = []
test_del(1,1) = all(a == [10 30 40])

% 2 múltiplos
a([1 3]) = []
test_del(2,1) = all(a == [30])

% 3 matriz coluna
A = [1 2 3;4 5 6]
A(:,2) = []
test_del(3,1) = all(all(A == [1 3;4 6]))

% 4 matriz linha
A = [1 2 3;4 5 6]
A(2,:) = []
test_del(4,1) = all(all(A == [1 2 3]))

% =========================
% 3D DELEÇÃO
% =========================

A = cat(3,[1 2 3;4 5 6;7 8 9],[10 11 12;13 14 15;16 17 18])

% 5 coluna em todas páginas
A(:,2,:) = []
test_del(5,1) = (size(A,2) == 2)

% 6 múltiplas colunas
A = cat(3,[1 2 3;4 5 6;7 8 9],[10 11 12;13 14 15;16 17 18])
A(:,[2 3],:) = []
test_del(6,1) = (size(A,2) == 1)

% 7 página
A(:,:,2) = []
test_del(7,1) = (size(A,3) == 1)

% =========================
% ERRO DELEÇÃO
% =========================

A = [1 2;3 4]
A(1,1) = [] % error
test_del(8,1) = true

% =========================
% DELEÇÃO COM END
% =========================

a = [10 20 30 40]

% 9
a(end) = []
test_del(9,1) = all(a == [10 20 30])

% 10
a(2:end) = []
test_del(10,1) = all(a == [10])

% =========================
% MATRIZ 2D
% =========================

A = [1 2 3;4 5 6]

% 11
A(:,end) = []
test_del(11,1) = all(all(A == [1 2;4 5]))

% 12
A = [1 2 3;4 5 6]
A(end,:) = []
test_del(12,1) = all(all(A == [1 2 3]))

% =========================
% 3D
% =========================

A = cat(3,[1 2 3;4 5 6;7 8 9],[10 11 12;13 14 15;16 17 18])

% 13
A(:,:,end) = []
test_del(13,1) = (size(A,3) == 1)

% 14 delete lógico linha
a = [1 2 3 4]
a(a > 2) = []
test_del(14,1) = all(a == [1 2])

% 15 delete lógico coluna
a = [1;2;3;4]
a(a > 2) = []
test_del(15,1) = all(a == [1;2])

% 16 delete máscara explícita
a = [1 2 3 4]
a([true false true false]) = []
test_del(16,1) = all(a == [2 4])

complete_test_result_index_del = all(test_del)

%% =========================
% PARTE 4 - INDEXAÇÃO LÓGICA (RHS)
%% =========================

% 1 básico
a = [10 20 30 40]
b = a(a > 20)
test_log_rhs(1,1) = all(b == [30 40])

% 2 vetor coluna
a = [10;20;30;40]
b = a(a > 20)
test_log_rhs(2,1) = all(b == [30;40])

% 3 matriz lógica
A = [1 2;3 4]
mask = [true false;false true]
b = A(mask)
test_log_rhs(3,1) = all(b == [1;4])

% 4 flatten implícito
A = [1 2;3 4]
mask = [true false true false]
b = A(mask)
test_log_rhs(4,1) = all(b == [1 2])

% 5 máscara maior (erro)
A = [1 2;3 4]
mask = [true true true true true]
A(mask) % error
test_log_rhs(5,1) = true

% 6 máscara escalar true
a = [10 20 30]
b = a(true)
test_log_rhs(6,1) = all(b == 10)

% 7 máscara escalar false
b = a(false)
test_log_rhs(7,1) = isempty(b)

complete_test_result_index_log_rhs = all(test_log_rhs)

%% =========================
% PARTE 5 - INDEXAÇÃO LÓGICA (LHS)
%% =========================

% 1 substituição simples
A = [1 2;3 4]
A(A > 2) = 0
test_log_lhs(1,1) = all(all(A == [1 2;0 0]))

% 2 broadcasting escalar
A = [1 2;3 4]
A(A > 2) = 9
test_log_lhs(2,1) = all(all(A == [1 2;9 9]))

% 3 múltiplos valores
A = [1 2;3 4]
A(A > 2) = [10 20]
test_log_lhs(3,1) = all(all(A == [1 2;10 20]))

% 4 vetor linha
a = [1 2 3 4]
a(a > 2) = 0
test_log_lhs(4,1) = all(a == [1 2 0 0])

% 5 vetor coluna
a = [1;2;3;4]
a(a > 2) = 0
test_log_lhs(5,1) = all(a == [1;2;0;0])

% 6 erro de dimensão
A = [1 2;3 4]
A(A > 2) = [1 2 3] % error
test_log_lhs(6,1) = true

% 7 variável inválida
clear A
A(A > 2) = 1 % error
test_log_lhs(7,1) = true

% 8 deleção lógica (vetor linha)
A = [1 2 3 4]
A(A > 2) = []
test_log_lhs(8,1) = all(A == [1 2])

% 9 deleção lógica (vetor coluna)
A = [1; 2; 3; 4]
A(A > 2) = []
test_log_lhs(9,1) = all(A == [1;2])

% 10 deleção lógica (máscara explícita)
A = [1 2 3 4]
A([true false true false]) = []
test_log_lhs(10,1) = all(A == [2 4])

% 11 broadcast com máscara linha
a = [1 2 3 4]
a([true false true false]) = 0
test_log_lhs(11,1) = all(a == [0 2 0 4])

% 12 broadcast coluna
a = [1;2;3;4]
a([true false true false]') = 0
test_log_lhs(12,1) = all(a == [0;2;0;4])

complete_test_result_index_log_lhs = all(test_log_lhs)

%% =========================
% RESULTADO FINAL
%% =========================

complete_test_result_indexing = all([
    complete_test_result_index_rhs;
    complete_test_result_index_lhs;
    complete_test_result_index_del;
    complete_test_result_index_log_rhs;
    complete_test_result_index_log_lhs
])

complete_test_result_indexing
