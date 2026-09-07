clear % clear all variables

% ============= EIG - MATRIZES DE TESTE =============

% Pré-alocação dos resultados (cresce automaticamente se desejar expandir)
test_result_eig(1,1) = true   % linha inicial só para inicializar

% ----------------------------------------------
% 1. Matriz identidade
A = eye(3)
[V,D] = eig(A)
test_result_eig(1,1) = all(all(abs(A*V - V*D) < 1e-9))

% ----------------------------------------------
% 2. Matriz diagonal
A = diag([3 5 -2])
[V,D] = eig(A)
test_result_eig(2,1) = all(all(abs(A*V - V*D) < 1e-9))

% % ----------------------------------------------
% % 3. Matriz simétrica 2x2
% A = [2 1
%      1 2]
% [V,D] = eig(A)
% test_result_eig(3,1) = all(all(abs(A*V - V*D) < 1e-9))

% % ----------------------------------------------
% % 4. Matriz simétrica 3x3 (autovalores reais garantidos)
% A = [4 2 2
%      2 5 1
%      2 1 3]
% [V,D] = eig(A)
% test_result_eig(4,1) = all(all(abs(A*V - V*D) < 1e-9))

% % ----------------------------------------------
% % 5. Matriz com autovalores negativos
% A = [-4  2
%       2 -1]
% [V,D] = eig(A)
% test_result_eig(5,1) = all(all(abs(A*V - V*D) < 1e-9))

% % ----------------------------------------------
% % 6. Matriz com parte imaginária
% A = [2+i 1-i
%      1+i 3-i]
% [V,D] = eig(A)
% test_result_eig(6,1) = all(all(abs(A*V - V*D) < 1e-9))

% % ----------------------------------------------
% % 7. Matriz com autovalores complexos conjugados
% A = [0 -1
%      1  0]
% [V,D] = eig(A)
% test_result_eig(7,1) = all(all(abs(A*V - V*D) < 1e-9))

% % ----------------------------------------------
% % 8. Matriz aleatória 4x4 (teste geral)
% A = rand(4)
% [V,D] = eig(A)
% test_result_eig(8,1) = all(all(abs(A*V - V*D) < 1e-9))

% % ----------------------------------------------
% % 9. Matriz aleatória 6x6 (sensível numericamente)
% A = rand(6)
% [V,D] = eig(A)
% test_result_eig(9,1) = all(all(abs(A*V - V*D) < 1e-8))

% ----------------------------------------------
% Resultado final
complete_test_result_eig = all(test_result_eig)

% Mostra resultado final no console
complete_test_result_eig
