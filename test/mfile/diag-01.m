clear % clear all variables

A = diag([1,2,3,4])
B = diag([1;2;3;4])
C = [1,2,3,4;5,6,7,8;9,10,11,12;13,14,15,16]
D = diag(C)
E = diag(C,2,3) % error
F = [1,2,3,4,5]
G = diag(F,3,4)
H = diag(C,1)
I = diag(C,2)
J = diag(C,-1)
K = diag(C,-2)

test_result_diag_01(1,1) = true

complete_test_result_diag_01 = all(test_result_diag_01)

complete_test_result_diag_01
