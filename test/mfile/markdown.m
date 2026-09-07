clear
% Test markdown function
% Load using CDN
markdown('https://cdn.jsdelivr.net/gh/MathJSLab/mathjslab-app/doc/en/trigonometric-functions.md')
% Load from GitHub
markdown('https://raw.githubusercontent.com/MathJSLab/mathjslab-app/main/doc/en/complex-operations-and-functions.md')
markdown('https://raw.githubusercontent.com/MathJSLab/mathjslab-app/main/doc/en/documentation/compatible-array-sizes-for-basic-operations.md')
markdown('https://raw.githubusercontent.com/MathJSLab/mathjslab-app/main/doc/en/documentation/array-vs-matrix-operations.md')
markdown('https://raw.githubusercontent.com/MathJSLab/mathjslab-app/main/doc/en/row-and-column-major-order.md')
markdown('https://raw.githubusercontent.com/MathJSLab/mathjslab-app/main/doc/pt/dia-da-semana.md')
% Load using relative path
markdown('help/en/abs.md')

test_result_markdown(1,1) = true

complete_test_result_markdown = all(test_result_markdown)

complete_test_result_markdown
