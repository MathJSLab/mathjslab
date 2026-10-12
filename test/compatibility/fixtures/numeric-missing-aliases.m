% MATLAB R2023a numeric missing aliases; not accepted by Octave 9.3.0.
A = [1,NaN,3];
compatible = sum(A,"omitmissing")==4 && prod(A,"omitmissing")==3;
compatible = compatible && mean(A,"omitmissing")==2;
compatible = compatible && var(A,0,"omitmissing")==2 && std(A,1,"omitmissing")==1;
compatible = compatible && isequal(cumsum(A,"omitmissing"),[1,1,4]);
compatible = compatible && isequal(cumprod(A,"omitmissing"),[1,1,3]);
compatible = compatible && isnan(mean(A,"includemissing"));
pageMean = mean(reshape(1:8,[2,2,2]),[1,3],"omitmissing");
compatible = compatible && isequal(pageMean,[3.5,5.5]);
compatible
