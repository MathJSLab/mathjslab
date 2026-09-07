clear % clear all variables

% 1. Diagonal matrix
A = [1,0,0;0,2,0;0,0,3]
D = eig(A)

% 2. Small, general
A = rand(3)
D = eig(A)

% 3. Numerically sensitive matrix ( A = hilb(4) )
A = [1, 1/2, 1/3, 1/4; 1/2, 1/3, 1/4, 1/5; 1/3, 1/4, 1/5, 1/6; 1/4, 1/5, 1/6, 1/7]
D = eig(A)

% 4. Full integer matrix ( A = magic(4) )
A= [16, 2, 3, 13; 5, 11, 10, 8; 9, 7, 6, 12; 4, 14, 15, 1]
D = eig(A)

% 5. Symmetric positive definite matrix ( A = gallery("lehmer",4) )
A = [1, 1/2, 1/3, 1/4; 1/2, 1, 2/3, 1/2; 1/3, 2/3, 1, 3/4; 1/4, 1/2, 3/4, 1]
D = eig(A)

test_result_eig_02(1,1) = true

complete_test_result_eig_02 = all(test_result_eig_02)

complete_test_result_eig_02
