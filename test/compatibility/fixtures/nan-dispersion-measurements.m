A=[1,NaN,NaN;3,5,NaN;NaN,7,NaN];
V=var(A,0,1,"omitnan");
P=var(A,1,1,"omitnan");
S=std(A,0,1,"omitnan");
compatible=isequal(V(1:2),[2,2]) && isnan(V(3)) && isequal(P(1:2),[1,1]) && isnan(P(3)) && isequal(S(1:2),sqrt(V(1:2))) && isnan(S(3)) && isequal(var(A,0,2,"omitnan"),[0;2;0]) && all(isnan(var(A))) && isequal(isnan(A),[false,true,true;false,false,true;true,false,true]);
compatible
