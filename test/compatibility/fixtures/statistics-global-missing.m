A=reshape([1,NaN,NaN,NaN,3,5,7,9],[2,2,2]);
M=mean(A,[1,3],"omitnan");
V=var(A,0,[3,1],"omitnan");
compatible=isequal(M,[3,8]) && isequal(V,[4,2]) && mean(A,"all","omitnan")==5 && var(A,0,"all","omitnan")==10 && std(A,1,[1,2,3],"omitnan")==sqrt(8) && isnan(mean([Inf,-Inf;1,NaN],[1,2],"omitnan")) && isnan(var([NaN,NaN],0,"all","omitnan")) && var([NaN,7],0,[1,2],"omitnan")==0 && isnan(std(zeros(2,0,3),0,"all")) && isequal(size(mean(zeros(2,0,3),[1,3])),[1,0]) && isequal(size(var(ones(2,3,4),0,[8,9])),[2,3,4]);
compatible
