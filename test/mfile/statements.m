clear
A = 1
if A>2 % test condition
    x = true;
    %{
A block comment

    %}
else
    x = false;
end % end test
test_result_statements(1,1) = isequal(x, x)


complete_test_result_statements = all(test_result_statements)

complete_test_result_statements
