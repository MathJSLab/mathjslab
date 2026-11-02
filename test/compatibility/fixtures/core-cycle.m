% Hermitian eigenpairs, native indexed outputs and a loaded function workspace.
function y=cycle_index(v)
  global cycle_calls;
  cycle_calls+=1;
  pause(0);
  y=v;
end
function [a,b]=cycle_pair()
  pause(0);
  a=10; b=20;
end
function y=cycle_loaded()
  x=3;
  load("cycle-outer.m");
  y=x;
end
global cycle_calls;
cycle_calls=0;
A=[1,i;-i,2];
[V,D,T]=eig(A);
eigen_ok=max(abs((A*V-V*D)(:)))<1e-11 && max(abs((V'*V-eye(2))(:)))<1e-11 && all(T(:)==A(:));
dest=[0,0];
[dest(cycle_index(1)),dest(cycle_index(2))]=cycle_pair();
loaded_value=cycle_loaded();
cycle_ok=eigen_ok && all(dest==[10,20]) && cycle_calls==2 && loaded_value==12 && exist("x","var")==0;
cycle_ok
