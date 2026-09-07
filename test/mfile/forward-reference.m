clear % clear all variables
% Forward reference
A = 1
B = 2
C = D + 1
D = 3
test_result_forward_reference(1,1) = isequal(A, A)
test_result_forward_reference(2,1) = isequal(C, C)
test_result_forward_reference(3,1) = isequal(C == 4, C == 4)

clear % clear all variables
% Forward reference
A = 1 % Previous definition
X = A + B + 1 % error - definition with undefined reference
B = 5 % definition of previous undefined reference
test_result_forward_reference(4,1) = isequal(X, X)
test_result_forward_reference(5,1) = isequal(X == 7, X == 7)

clear % clear all variables
% Double undefined
X = A + B + 1 % error - definition with undefined reference
B = 5 % definition of previous undefined reference
X
A = 4
test_result_forward_reference(6,1) = isequal(X, X)
test_result_forward_reference(7,1) = isequal(X == 10, X == 10)

% clear % clear all variables
% configure('allowForwardReference', false)
% C = D + 1   % erro imediato: 'D' undefined
% D = 3
% C

clear % clear all variables
% circular dependecy
A = B + 1
B = A + 1

A = B + 1
B = C + 1
C = A + 1

X = A + B + 1
B = 5
A = 4
X == 10


complete_test_result_forward_reference = all(test_result_forward_reference)

complete_test_result_forward_reference
