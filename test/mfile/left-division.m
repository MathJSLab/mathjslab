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

test_result_left_division(1,1) = true

complete_test_result_left_division = all(test_result_left_division)

complete_test_result_left_division
