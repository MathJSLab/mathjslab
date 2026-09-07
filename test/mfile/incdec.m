clear % clear all variables
a = 1
test_result_incdec(1,1) = isequal(a++, a++)
test_result_incdec(2,1) = isequal(ans, ans)
test_result_incdec(3,1) = isequal(a++, a++)
test_result_incdec(4,1) = isequal(ans, ans)
test_result_incdec(5,1) = isequal(++a, ++a)
test_result_incdec(6,1) = isequal(ans, ans)
test_result_incdec(7,1) = isequal(++a, ++a)
test_result_incdec(8,1) = isequal(ans, ans)


complete_test_result_incdec = all(test_result_incdec)

complete_test_result_incdec
