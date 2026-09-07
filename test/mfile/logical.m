clear
% Test logical operations.
test_result_logical(1,1) = isequal(3>2, 3>2)
test_result_logical(2,1) = isequal((3>2)+1, (3>2)+1)
A=[1,2,3;4,5,6;7,8,9]
B=A>5
B=A>=5
test_result_logical(3,1) = isequal(B+1, B+1)
test_result_logical(4,1) = isequal((A>5)+1, (A>5)+1)
test_result_logical(5,1) = isequal(1+(A>5), 1+(A>5))
test_result_logical(6,1) = isequal(logical(eye(4)), logical(eye(4)))
test_result_logical(7,1) = isequal(e^(i*pi)==-1, e^(i*pi)==-1)
test_result_logical(8,1) = isequal(i^i==e^-(pi/2), i^i==e^-(pi/2))
test_result_logical(9,1) = isequal((2+i)==(1+2i), (2+i)==(1+2i))
test_result_logical(10,1) = isequal(root(64,3)==4, root(64,3)==4)
test_result_logical(11,1) = isequal(root(2^(3*16),3)==2^16, root(2^(3*16),3)==2^16)
test_result_logical(12,1) = isequal(root(2^(3*1.02399999999999999991e3),3)==2^1.02399999999999999991e3, root(2^(3*1.02399999999999999991e3),3)==2^1.02399999999999999991e3)
test_result_logical(13,1) = isequal(root((1e-323),323)==0.1, root((1e-323),323)==0.1)
test_result_logical(14,1) = isequal(root(64,3)!=4, root(64,3)!=4)
test_result_logical(15,1) = isequal(root(2^(3*16),3)!=2^16, root(2^(3*16),3)!=2^16)
test_result_logical(16,1) = isequal(root(2^(3*1.02399999999999999991e3),3)!=2^1.02399999999999999991e3, root(2^(3*1.02399999999999999991e3),3)!=2^1.02399999999999999991e3)
test_result_logical(17,1) = isequal(root((1e-323),323)!=0.1, root((1e-323),323)!=0.1)
test_result_logical(18,1) = isequal(e^(i*pi)==-1, e^(i*pi)==-1)
A=2+i
B=1+2i
test_result_logical(19,1) = isequal(A>B, A>B)
test_result_logical(20,1) = isequal(B>A, B>A)
test_result_logical(21,1) = isequal(A>=B, A>=B)
test_result_logical(22,1) = isequal(B>=A, B>=A)
test_result_logical(23,1) = isequal(A==B, A==B)
test_result_logical(24,1) = isequal(A!=B, A!=B)
test_result_logical(25,1) = isequal(gt(B,A), gt(B,A))
A = randi(10,[4,5])
B = mod(A,2)
C = B & 1
test_result_logical(26,1) = isequal(B | 1, B | 1)
test_result_logical(27,1) = isequal(B && 1, B && 1)
test_result_logical(28,1) = isequal(B || 1, B || 1)
test_result_logical(29,1) = isequal((B || 1) && 1, (B || 1) && 1)
test_result_logical(30,1) = isequal(!1, !1)
test_result_logical(31,1) = isequal(!0, !0)


complete_test_result_logical = all(test_result_logical)

complete_test_result_logical
