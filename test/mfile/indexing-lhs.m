clear % clear all variables

% Parte 1 - Vetor simples
a = [10, 20, 30, 40]
a(2) = 99
a(4) = -5
expected = [10, 99, 30, -5]
test_result_index_lhs(1,1) = all(a == expected)

% Parte 2 - Expansão de vetor
a = [1, 2, 3]
a(5) = 10
expected = [1, 2, 3, 0, 10]
test_result_index_lhs(2,1) = all(a == expected)

% Parte 3 - Indexação com vetor de índices
a = [10, 20, 30, 40]
a([1, 3]) = [100, 300]
expected = [100, 20, 300, 40]
test_result_index_lhs(3,1) = all(a == expected)

% Parte 4 - Broadcasting escalar
a = [1, 2, 3, 4]
a([2, 4]) = 0
expected = [1, 0, 3, 0]
test_result_index_lhs(4,1) = all(a == expected)

% Parte 5 - Índice linear (coluna-major)
A = [1 2; 3 4]
A(3) = 99
expected = [1 99; 3 4]
test_result_index_lhs(5,1) = all(all(A == expected))

% Parte 6 - Índices linha/coluna
A = [1 2; 3 4]
A(2,1) = 88
A(1,2) = -1
expected = [1 -1; 88 4]
test_result_index_lhs(6,1) = all(all(A == expected))

% Parte 7 - Submatriz com ranges
A = [1 2 3; 4 5 6; 7 8 9]
A(1:2, 2:3) = [20 30; 50 60]
expected = [1 20 30; 4 50 60; 7 8 9]
test_result_index_lhs(7,1) = all(all(A == expected))

% Parte 8 - Coluna inteira
A = [1 2 3; 4 5 6]
A(:,2) = [10; 20]
expected = [1 10 3; 4 20 6]
test_result_index_lhs(8,1) = all(all(A == expected))

% Parte 9 - Linha inteira
A = [1 2 3; 4 5 6]
A(1,:) = [7 8 9]
expected = [7 8 9; 4 5 6]
test_result_index_lhs(9,1) = all(all(A == expected))

% Parte 10 - Índice misto
A = [1 2 3; 4 5 6]
A(2, [1 3]) = [40 60]
expected = [1 2 3; 40 5 60]
test_result_index_lhs(10,1) = all(all(A == expected))

% Parte 11 - Deleção em vetor
a = [10 20 30 40]
a(2) = []
expected = [10 30 40]
test_result_index_lhs(11,1) = all(a == expected)

% Parte 12 - Deleção de coluna
A = [1 2 3; 4 5 6]
A(:,2) = []
expected = [1 3; 4 6]
test_result_index_lhs(12,1) = all(all(A == expected))

% Parte 13 - Indexação lógica
a = [10 20 30 40 50 60 70 80 90]
a(a > 40) = 7
expected = [10 20 30 40 7 7 7 7 7]
test_result_index_lhs(13,1) = all(a == expected)

% Parte 14 - Preenchimento total
A = zeros(3,3)
A(:,:) = 1
expected = [1 1 1; 1 1 1; 1 1 1]
test_result_index_lhs(14,1) = all(all(A == expected))

% Parte 15 - Erro esperado (dimensão incompatível)
A = [1 2; 3 4]
A(1,:) = [10 20 30]; % error
test_result_index_lhs(15,1) = true

% Parte 16 - Erro esperado (indexação encadeada inválida)
A = [1 2; 3 4]
A(1,1)(1) = 99; % error
test_result_index_lhs(16,1) = true

% Parte 17 - Erro esperado (função no LHS)
f = @(x) 2*x^2+-1*x+3
f(1) = 10; % error
test_result_index_lhs(17,1) = true

% Resultado final
complete_test_result_index_lhs = all(test_result_index_lhs)
complete_test_result_index_lhs
