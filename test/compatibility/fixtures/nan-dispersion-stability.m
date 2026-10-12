A=[1e16,NaN,1e16+2,1e16+4];
C=[complex(1e16,1e16),complex(1e16+2,1e16+2),complex(1e16+4,1e16+4)];
compatible=var([1e16,1e16+2])==2 && var(A,0,"omitnan")==4 && std(A,0,"omitnan")==2 && var(C)==8 && isreal(var(C)) && var([1e308,1e308])==0 && var([1+i,complex(2,NaN),3+3i],0,"omitnan")==4 && isnan(var([Inf,NaN],0,"omitnan")) && isnan(std([NaN,NaN],"omitnan")) && var([NaN,7],"omitnan")==0 && isnan(var([])) && isequal(class(var(true)),"double");
compatible
