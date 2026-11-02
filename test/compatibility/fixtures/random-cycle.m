% Versioned random state, native index order, scaled eigenpairs and complex cond.
rng(42);
randomState=rng();
randomFirst=rand(2,3);
randomInts=randi([-2,3],2,3);
rng(randomState);
randomOk=isequal(randomFirst,rand(2,3)) && isequal(randomInts,randi([-2,3],2,3));
randomOk=randomOk && randi(1)==1 && randi([0,0])==0;
randomMatrix=1e-100*[2,1;1,2];
[randomV,randomD]=eig(randomMatrix);
randomOk=randomOk && norm((randomMatrix/1e-100)*randomV-randomV*(randomD/1e-100),'fro')<1e-11;
randomOk=randomOk && abs(cond(1e-100*[1,i;-i,2])-(7+3*sqrt(5))/2)<1e-10;
randomOk=randomOk && rank(randomMatrix)==2;
function d=randomCycleDimension(), pause(0.001); d=2; end
rng(29);
randomSuspended=rand(randomCycleDimension(),3);
rng(29);
randomOk=randomOk && isequal(randomSuspended,rand(2,3));
randomOk
