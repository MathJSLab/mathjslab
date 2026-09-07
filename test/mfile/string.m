clear
S = "asdfghjkl"
S = "asdfg\nhjkl"
S = "asdfg\x0dhjkl"
test_result_string(1,1) = isequal(S + 1, S + 1)


complete_test_result_string = all(test_result_string)

complete_test_result_string
