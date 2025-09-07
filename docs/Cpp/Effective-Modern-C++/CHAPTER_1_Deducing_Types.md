

[TOC]




# 第一章 类型推导

## **Item 1: Understand template type deduction**

对于

```cpp
template<typename T>
void f(ParamType param);

f(expr);                        //从expr中推导T和ParamType
```

- 在编译期间，编译器使用`expr`进行两个类型推导：
- 一个是针对`T`的，另一个是针对`ParamType`的。
- 这两个类型通常是不同的，因为`ParamType`包含一些修饰，比如`const`和引用修饰符。

---



### [情景一：`ParamType`是一个指针或引用，但不是通用引用](https://cntransgroup.github.io/EffectiveModernCppChinese/1.DeducingTypes/item1.html#情景一paramtype是一个指针或引用但不是通用引用)

最简单的情况是`ParamType`是一个指针或者引用，但非通用引用。在这种情况下，类型推导会这样进行：

1. 如果`expr`的类型是一个引用，**忽略引用部分**
2. 然后`expr`的类型与`ParamType`进行模式匹配来决定`T`

```cpp
template<typename T>
void f(const T& param);         //param现在是reference-to-const

int x = 27;                     //如之前一样
const int cx = x;               //如之前一样
const int& rx = x;              //如之前一样

f(x);                           //T是int，param的类型是const int&
f(cx);                          //T是int，param的类型是const int&
f(rx);                          //T是int，param的类型是const int&
```

- `rx`的reference-ness在类型推导中被忽略了。

指针类似：

```cpp
template<typename T>
void f(T* param);               //param现在是指针

int x = 27;                     //同之前一样
const int *px = &x;             //px是指向作为const int的x的指针

f(&x);                          //T是int，param的类型是int*
f(px);                          //T是const int，param的类型是const int*
```

`px`的point-ness在类型推导中被忽略了

---



### [情景二：`ParamType`是一个通用引用](https://cntransgroup.github.io/EffectiveModernCppChinese/1.DeducingTypes/item1.html#情景二paramtype是一个通用引用)

这样的形参被声明为像右值引用一样（也就是，在函数模板中假设有一个类型形参`T`，那么通用引用声明形式就是`T&&`或者是`auto&&`)

- 如果`expr`是左值，`T`和`ParamType`都会被推导为左值引用。这非常不寻常，第一，这是模板类型推导中唯一一种`T`被推导为引用的情况。第二，虽然`ParamType`被声明为右值引用类型，但是最后推导的结果是左值引用。
- 如果`expr`是右值，就使用正常的（也就是**情景一**）推导规则

```cpp
template<typename T>
void f(T&& param);              //param现在是一个通用引用类型
        
int x=27;                       //如之前一样
const int cx=x;                 //如之前一样
const int & rx=cx;              //如之前一样

f(x);                           //x是左值，所以T是int&，
                                //param类型也是int&

f(cx);                          //cx是左值，所以T是const int&，
                                //param类型也是const int&

f(rx);                          //rx是左值，所以T是const int&，
                                //param类型也是const int&

f(27);                          //27是右值，所以T是int，
                                //param类型就是int&&

```

---



### [情景三：`ParamType`既不是指针也不是引用](https://cntransgroup.github.io/EffectiveModernCppChinese/1.DeducingTypes/item1.html#情景三paramtype既不是指针也不是引用)

当`ParamType`既不是指针也不是引用时，我们通过**传值（pass-by-value）**的方式处理：

1. 和之前一样，如果`expr`的类型是一个引用，**忽略这个引用部分**
2. 如果忽略`expr`的引用性（reference-ness）之后，`expr`是一个`const`，那就再忽略`const`。如果它是`volatile`，也忽略`volatile`（`volatile`对象不常见，它通常用于驱动程序的开发中。关于`volatile`的细节请参见[Item40](https://cntransgroup.github.io/EffectiveModernCppChinese/7.TheConcurrencyAPI/item40.html)）

```cpp
template<typename T>
void f(T param);                //以传值的方式处理param

int x=27;                       //如之前一样
const int cx=x;                 //如之前一样
const int & rx=cx;              //如之前一样

f(x);                           //T和param的类型都是int
f(cx);                          //T和param的类型都是int
f(rx);                          //T和param的类型都是int

```

- `param`是一个完全独立于`cx`和`rx`的对象——是`cx`或`rx`的一个拷贝。
- 具有常量性的`cx`和`rx`不可修改并不代表`param`也是一样。

只有在传值给形参时才会忽略`const`（和`volatile`）这一点很重要:

```cpp
template<typename T>
void f(T param);                //仍然以传值的方式处理param

const char* const ptr =         //ptr是一个常量指针，指向常量对象 
    "Fun with pointers";

f(ptr);                         //传递const char * const类型的实参
```

- 像这种情况，`ptr`**自身的值会被传给形参**，根据类型推导的第三条规则，`ptr`自身的常量性`const`ness将会被省略，所以`param`是`const char*`
- 在类型推导中，这个指针指向的数据的常量性`const`ness将会被保留，但是当拷贝`ptr`来创造一个新指针`param`时，`ptr`自身的常量性`const`ness将会被忽略。

---



### 数组形参

```cpp
const char name[] = "J. P. Briggs";     //name的类型是const char[13]

const char * ptrToName = name;          //数组退化为指针
```

在这里`const char*`指针`ptrToName`会由`name`初始化，而`name`的类型为`const char[13]`，这**两种类型（`const char*`和`const char[13]`）是不一样的**，但是由于**数组退化为指针**的规则，编译器允许这样的代码。



- 传值给模板的一个数组类型会被推导为一个指针类型

```cpp
void myFunc(int param[]);
void myFunc(int* param);                //与上面相同的函数

template<typename T>
void f(T param);                        //传值形参的模板

f(name);                        //name是一个数组，但是T被推导为const char*
```

- 函数不能声明形参为真正的数组，但是**可以**接受指向数组的**引用**，使得`T`被推导为了真正的数组。

```cpp
template<typename T>
void f(T& param);                       //传引用形参的模板
f(name);                                //T被推导为const char[13]
```

借助可声明指向数组的引用的能力，使得我们可以**创建一个模板函数来推导出数组的大小**

```cpp
//在编译期间返回一个数组大小的常量值（//数组形参没有名字，
//因为我们只关心数组的大小）
template<typename T, std::size_t N>                     //关于
constexpr std::size_t arraySize(T (&)[N]) noexcept      //constexpr
{                                                       //和noexcept
    return N;                                           //的信息
}                                                       //请看下面

```

（`constexpr`是一种比`const`更加严格的常量定义，`noexcept`是说明函数永远都不会抛出异常——译者注）

---



### 函数实参

在C++中不只是数组会退化为指针，**函数类型也会退化为一个函数指针**

```cpp
void someFunc(int, double);         //someFunc是一个函数，
                                    //类型是void(int, double)

template<typename T>
void f1(T param);                   //传值给f1

template<typename T>
void f2(T & param);                 //传引用给f2

f1(someFunc);                       //param被推导为指向函数的指针，
                                    //类型是void(*)(int, double)
f2(someFunc);                       //param被推导为指向函数的引用，
                                    //类型是void(&)(int, double)

```

---



### 总结

> [!note]
>
> - 在模板类型推导时，有引用的实参会被视为无引用，他们的**引用会被忽略**
> - 对于通用引用的推导，**左值实参会被特殊对待**
> - 对于传值类型推导，`const`和/或`volatile`实参会被认为是non-`const`的和non-`volatile`的
> - 在模板类型推导时，**数组名或者函数名实参会退化为指针**，除非它们被用于初始化引用

---





## **Item 2: Understand `auto` type deduction**

### 和模板类型推导相同点

当一个变量使用`auto`进行声明时，`auto`扮演了模板中`T`的角色，变量的类型说明符扮演了`ParamType`的角色。

在使用`auto`作为类型说明符的变量声明中，类型说明符代替了`ParamType`，因此Item1描述的三个情景稍作修改就能适用于auto：

- 情景一：类型说明符是一个指针或引用但不是通用引用
- 情景二：类型说明符一个通用引用
- 情景三：类型说明符既不是指针也不是引用

```cpp
auto x = 27;                    //情景三（x既不是指针也不是引用）
const auto cx = x;              //情景三（cx也一样）
const auto & rx=cx;             //情景一（rx是非通用引用）

//情景二：
auto&& uref1 = x;               //x是int左值，
                                //所以uref1类型为int&
auto&& uref2 = cx;              //cx是const int左值，
                                //所以uref2类型为const int&
auto&& uref3 = 27;              //27是int右值，
                                //所以uref3类型为int&&

//数组和函数名如何退化为指针。那些内容也同样适用于auto类型推导：
const char name[] =             //name的类型是const char[13]
 "R. N. Briggs";

auto arr1 = name;               //arr1的类型是const char*
auto& arr2 = name;              //arr2的类型是const char (&)[13]

void someFunc(int, double);     //someFunc是一个函数，
                                //类型为void(int, double)

auto func1 = someFunc;          //func1的类型是void (*)(int, double)
auto& func2 = someFunc;         //func2的类型是void (&)(int, double)
```

---



### 和模板类型推导的区别

**当用`auto`声明的变量使用花括号进行初始化，`auto`类型推导推出的类型则为`std::initializer_list`。**

```cpp
auto x1 = 27;                   //类型是int，值是27
auto x2(27);                    //同上
auto x3 = { 27 };               //类型是std::initializer_list<int>，
                                //值是{ 27 }
auto x4{ 27 };                  //同上
```

> [!warning]
>
> `auto x4{27}` 在书中称 `auto` 推导出 `std::initializer_list<int>`。然而，在 [N3922](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2014/n3922.html) 之后，将会推导出 `int`。
>
> ```cpp
> auto x1 = {3}; // x1 is std::initializer_list<int>
> auto x2{1, 2}; // error: not a single element
> auto x3{3};    // x3 is int
>                // (before N3922 x2 and x3 were both std::initializer_list<int>)
> ```

```cpp
auto x5 = { 1, 2, 3.0 };        //错误！无法推导std::initializer_list<T>中的T
```

这里确实发生了两种类型推导是很重要的。

- 一种是由于`auto`的使用：`x5`使用花括号的方式进行初始化，`x5`必须被推导为`std::initializer_list`。
- `std::initializer_list<T>`会被某种类型`T`实例化，`T`也会被推导，推导之所以失败，是因为在花括号中的值并不是同一种类型。

---

对于模板类型推导这样就行不通：

```cpp
auto x = { 11, 23, 9 };         //x的类型是std::initializer_list<int>

template<typename T>            //带有与x的声明等价的
void f(T param);                //形参声明的模板

f({ 11, 23, 9 });               //错误！不能推导出T

template<typename T>
void f(std::initializer_list<T> initList);

f({ 11, 23, 9 });               //T被推导为int，initList的类型为
                                //std::initializer_list<int>
```

> [!note]
>
> `auto`类型推导和模板类型推导的真正区别在于，`auto`类型推导假定花括号表示`std::initializer_list`而模板类型推导不会这样

---

但是C++14允许`auto`用于函数返回值并会被推导（参见[Item3](https://cntransgroup.github.io/EffectiveModernCppChinese/1.DeducingTypes/item3.html)），而且C++14的*lambda*函数也允许在形参声明中使用`auto`。但是在这些情况下`auto`实际上使用**模板类型推导**的那一套规则在工作，而不是`auto`类型推导。

```cpp
auto createInitList()
{
    return { 1, 2, 3 };         //错误！不能推导{ 1, 2, 3 }的类型
}

std::vector<int> v;
…
auto resetV = 
    [&v](const auto& newValue){ v = newValue; };        //C++14
…
resetV({ 1, 2, 3 });            //错误！不能推导{ 1, 2, 3 }的类型

```

### 总结



> [!note]
>
> - `auto`类型推导通常和模板类型推导相同，但是`auto`类型推导假定花括号初始化代表`std::initializer_list`，而模板类型推导不这样做
> - 在C++14中`auto`允许出现在函数返回值或者*lambda*函数形参中，但是它的工作机制是**模板类型推导**那一套方案，而不是`auto`类型推导

---



## **Item 3: Understand decltype**

### 主要作用

`decltype`只是简单的返回**名字或者表达式的类型**：

```cpp
const int i = 0;                //decltype(i)是const int

bool f(const Widget& w);        //decltype(w)是const Widget&
                                //decltype(f)是bool(const Widget&)

struct Point{
    int x,y;                    //decltype(Point::x)是int
};                              //decltype(Point::y)是int

Widget w;                       //decltype(w)是Widget

if (f(w))…                      //decltype(f(w))是bool

template<typename T>            //std::vector的简化版本
class vector{
public:
    …
    T& operator[](std::size_t index);
    …
};

vector<int> v;                  //decltype(v)是vector<int>
…
if (v[0] == 0)…                 //decltype(v[0])是int&
```

C++11，`decltype`最主要的用途就是用于**声明函数模板**，而这个函数返回类型依赖于形参类型。

```cpp
template<typename Container, typename Index>    //最终的C++14版本
decltype(auto)
authAndAccess(Container&& c, Index i)
{
    authenticateUser();
    return std::forward<Container>(c)[i];
}
```

`decltype(auto)`的使用不仅仅局限于函数返回类型，当你想对初始化表达式使用`decltype`推导的规则，你也可以使用：

```cpp
Widget w;

const Widget& cw = w;

auto myWidget1 = cw;                    //auto类型推导
                                        //myWidget1的类型为Widget
decltype(auto) myWidget2 = cw;          //decltype类型推导
                                        //myWidget2的类型是const Widget&
```

> [!warning]
>
> ```cpp
> decltype(auto) f1()
> {
>     int x = 0;
>     …
>     return x;                            //decltype(x）是int，所以f1返回int
> }
> 
> decltype(auto) f2()
> {
>     int x = 0;
>     return (x);                          //decltype((x))是int&，所以f2返回int&
> }
> ```
>
> 注意不仅`f2`的返回类型不同于`f1`，而且它还引用了一个局部变量！

---

### 总结

> [!note]
>
> - `decltype`总是**不加修改**的产生变量或者表达式的类型。
> - 对于`T`类型的不是单纯的变量名的左值表达式，`decltype`总是产出`T`的引用即`T&`。
> - C++14支持`decltype(auto)`，就像`auto`一样，推导出类型，但是它使**用`decltype`的规则**进行推导。

---



## **Item 4: Know how to view deduced types**

我们探究三种方案：在你编辑代码的时候获得类型推导的结果，在编译期间获得结果，在运行时获得结果。

### 1. [IDE编辑器](https://cntransgroup.github.io/EffectiveModernCppChinese/1.DeducingTypes/item4.html#ide编辑器)

- 在IDE中的代码编辑器通常可以显示程序代码中变量，函数，参数的类型，你只需要简单的把鼠标移到它们的上面
- 为此，你的代码必须或多或少的处于可编译状态，因为IDE之所以能提供这些信息是因为一个C++编译器（或者至少是前端中的一个部分）运行于IDE中。

---

### 2. [编译器诊断](https://cntransgroup.github.io/EffectiveModernCppChinese/1.DeducingTypes/item4.html#编译器诊断)

使用编译器出错时提供的错误消息。

```cpp
template<typename T>                //只对TD进行声明
class TD;                           //TD == "Type Displayer"

TD<decltype(x)> xType;              //引出包含x和y
TD<decltype(y)> yType;              //的类型的错误消息
```

***variableName*****Type**的结构来命名变量，因为这样它们产生的错误消息可以有助于我们查找

---

### 3. [运行时输出](https://cntransgroup.github.io/EffectiveModernCppChinese/1.DeducingTypes/item4.html#运行时输出)

使用`printf`的方法（并不是说我推荐你使用`printf`）类型信息要在运行时才会显示出来，但是它提供了一种格式化输出的方法。

```cpp
std::cout << typeid(x).name() << '\n';  //显示x和y的类型
std::cout << typeid(y).name() << '\n';
```

对一个对象如`x`或`y`调用`typeid`产生一个`std::type_info`的对象，然后`std::type_info`里面的成员函数`name()`来产生一个C风格的字符串（即一个`const char*`）表示变量的名字。

`td::type_info::name`的结果并不总是可信的
