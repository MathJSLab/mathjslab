clear % clear all variables

% Parte 1 - Vetor simples
a = [10, 20, 30, 40]
b = a(2)
expected = 20
test_result_index_rhs(1,1) = (b == expected)

% Parte 2 - Vetor com múltiplos índices
a = [10, 20, 30, 40]
b = a([1, 3])
expected = [10, 30]
test_result_index_rhs(2,1) = all(b == expected)

% Parte 3 - Indexação com range
a = [10, 20, 30, 40]
b = a(2:4)
expected = [20, 30, 40]
test_result_index_rhs(3,1) = all(b == expected)

% Parte 4 - Indexação com passo implícito
a = [1, 2, 3, 4, 5, 6]
b = a(1:2:5)
expected = [1, 3, 5]
test_result_index_rhs(4,1) = all(b == expected)

% Parte 5 - Indexação lógica
a = [10, 20, 30, 40]
b = a(a > 20)
expected = [30, 40]
test_result_index_rhs(5,1) = all(b == expected)

% Parte 6 - Índice linear em matriz
A = [1 2; 3 4]
b = A(3)
expected = 2
test_result_index_rhs(6,1) = (b == expected)

% Parte 7 - Índices linha/coluna
A = [1 2; 3 4]
b = A(2,1)
expected = 3
test_result_index_rhs(7,1) = (b == expected)

% Parte 8 - Linha inteira
A = [1 2 3; 4 5 6]
b = A(1,:)
expected = [1 2 3]
test_result_index_rhs(8,1) = all(b == expected)

% Parte 9 - Coluna inteira
A = [1 2 3; 4 5 6]
b = A(:,2)
expected = [2; 5]
test_result_index_rhs(9,1) = all(b == expected)

% Parte 10 - Submatriz com ranges
A = [1 2 3; 4 5 6; 7 8 9]
b = A(1:2, 2:3)
expected = [2 3; 5 6]
test_result_index_rhs(10,1) = all(all(b == expected))

% Parte 11 - Índice misto
A = [1 2 3; 4 5 6]
b = A(2, [1 3])
expected = [4 6]
test_result_index_rhs(11,1) = all(b == expected)

% Parte 12 - Uso de ':'
A = [1 2; 3 4]
b = A(:)
expected = [1; 3; 2; 4]
test_result_index_rhs(12,1) = all(b == expected)

% Parte 13 - Extração de elemento após slicing
a = [10, 20, 30, 40]
b = a(2:4)
c = b(2)
expected = 30
test_result_index_rhs(13,1) = (c == expected)

% Parte 14 - Indexação encadeada (válida no RHS)
A = [1 2; 3 4]
b = A(1,2)
c = b(1)
expected = 2
test_result_index_rhs(14,1) = (c == expected)

% Parte 15 - Indexação com expressão
a = [10, 20, 30, 40]
i = 2
b = a(i+1)
expected = 30
test_result_index_rhs(15,1) = (b == expected)

% Parte 16 - Indexação com vetor gerado
a = [10, 20, 30, 40]
idx = [1, 4]
b = a(idx)
expected = [10, 40]
test_result_index_rhs(16,1) = all(b == expected)

% Parte 17 - Erro esperado (índice fora do limite)
a = [1, 2, 3]
b = a(5) % error
test_result_index_rhs(17,1) = true

% Resultado final
complete_test_result_index_rhs = all(test_result_index_rhs)
complete_test_result_index_rhs
