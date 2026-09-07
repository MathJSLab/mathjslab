clear
% Test array operations
A = [1,2,0;1,1,0;-1,4,0]
B = [1,2,3;1,1,-1;2,2,2]
C = [1,2,3;1,1,-1;1,1,1]
D = [1,3,-9,5;2,-3,-5,5;2,8,-1,7;3,-4,3,6]
% Sum
F = A + B
% Scalar product
G = 2 * A
H = A * 2
% Division
M = A/B
% Negative
test_result_array_operation(1,1) = isequal(-M, -M)
% Mapping
test_result_array_operation(2,1) = isequal(sin(M), sin(M))
clear
a=2
A=[1,2,3;4,5,6;7,8,9]
B=[3,4,5;6,7,8;9,10,11]
C=[3,4,5]
D=[3;4;5]
F=[1,2,3,4]
G=[1;2;3;4]
test_result_array_operation(3,1) = isequal(A+a, A+a)
test_result_array_operation(4,1) = isequal(a+A, a+A)
test_result_array_operation(5,1) = isequal(A+B, A+B)
test_result_array_operation(6,1) = isequal(A+C, A+C)
test_result_array_operation(7,1) = isequal(A+D, A+D)
A+F % error
A+G % error
test_result_array_operation(8,1) = isequal(A-a, A-a)
test_result_array_operation(9,1) = isequal(a-A, a-A)
test_result_array_operation(10,1) = isequal(A-B, A-B)
test_result_array_operation(11,1) = isequal(A-C, A-C)
test_result_array_operation(12,1) = isequal(A-D, A-D)
A-F % error
A-G % error
test_result_array_operation(13,1) = isequal(A*B, A*B)
test_result_array_operation(14,1) = isequal(3*A, 3*A)
test_result_array_operation(15,1) = isequal(A*3, A*3)
A=[1,2,4;4,5,6]
B=[1,2;3,4;5,6]
test_result_array_operation(16,1) = isequal(A*B, A*B)
A.*B % error
A*[1,2,3] % error
test_result_array_operation(17,1) = isequal(A.*[1,2,3], A.*[1,2,3])
A=[1:3;4:6;7:9]
[1:3;4,5,6,7;7,8,9] % error
A=[1:3;4,5,6,7;7,8,9] % error
A=[1,2,3;4,5;7,8,9,10] % error
A=[pi/6,pi/2,3*pi/2]
test_result_array_operation(18,1) = isequal(size(A), size(A))
test_result_array_operation(19,1) = isequal(size(A'), size(A'))
A=[pi/6,pi/2,3*pi/2;3*pi,pi,6;7,8,9]
test_result_array_operation(20,1) = isequal(size(A), size(A))
B=sin(A)
A = [1,2,3;4,5,6;7,8,9]
C = A.^-1
a = [2,3]
b = (1:3)'
a = [2,3]
b = (1:3)'
test_result_array_operation(21,1) = isequal(a+b, a+b)
test_result_array_operation(22,1) = isequal(b+a, b+a)
test_result_array_operation(23,1) = isequal(a.^b, a.^b)
A = -1
B = 1/3
C = A.^B
A(1,1,3) % error
A(1) % error
A(1,1) % error
A(1,1)=100
test_result_array_operation(24,1) = isequal(A+B, A+B)
test_result_array_operation(25,1) = isequal(A+C, A+C)
test_result_array_operation(26,1) = isequal(A+D, A+D)
A+E % error
test_result_array_operation(27,1) = isequal(A+F, A+F)
test_result_array_operation(28,1) = isequal(A+G, A+G)
A+H % error
test_result_array_operation(29,1) = isequal(1*D, 1*D)
test_result_array_operation(30,1) = isequal(D*1, D*1)
test_result_array_operation(31,1) = isequal(2*C, 2*C)
test_result_array_operation(32,1) = isequal(C*2, C*2)
D*D % error
test_result_array_operation(33,1) = isequal(D.*D', D.*D') % broadcasting
A = [1, 1, 1; 2, 2, 2; 3, 3, 3]
m = [2, 4, 6]
test_result_array_operation(34,1) = isequal(A - m, A - m)
a = [1, 2, 3, 4]
b = [5; 6; 7]
test_result_array_operation(35,1) = isequal(a + b, a + b)
test_result_array_operation(36,1) = isequal(A*D, A*D)

complete_test_result_array_operation = all(test_result_array_operation)

complete_test_result_array_operation
