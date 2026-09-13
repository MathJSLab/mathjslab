clear % clear all variables
% Test for left division operator '\'.
A = [8, 1, 6; 3, 5, 7; 4, 9, 2]
B = [15; 15; 15]
X = A\B
B = [15, 3; 15, 3; 15, 3]
X = A\B
B = [15, 3; 15, 3; 15, 3; 15, 3]
X = A\B % error
A = 15
B = [15; 15; 15]
X = A\B
B = [15, 3; 15, 3; 15, 3]
X = A\B
A = [8, 1, 6; 3, 5, 7; 4, 9, 2]
B = 15
X = A\B % error

A = [1, 0; 0, 1; 1, 1]
B = [1; 2; 3]
X = A\B
test_result_left_division(1,1) = all(all(abs(X - [1; 2]) < 1e-12))

A = [1, 0, 0; 0, 1, 0]
B = [4; 5]
X = A\B
test_result_left_division(2,1) = all(all(abs(X - [4; 5; 0]) < 1e-12))

A = [1, 0; 0, 1; 1, 1]
B = [1; 2; 3]
X1 = B' / A'
X2 = mrdivide(B', A')
test_result_left_division(3,1) = all(all(abs(X1 - [1 2]) < 1e-12 & abs(X2 - [1 2]) < 1e-12))

complete_test_result_left_division = all(test_result_left_division)

complete_test_result_left_division
