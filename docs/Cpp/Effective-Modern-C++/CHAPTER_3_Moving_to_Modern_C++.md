---
[第3章 移步现代C++]
---

[TOC]

# [第3章 移步现代C++](https://cntransgroup.github.io/EffectiveModernCppChinese/3.MovingToModernCpp/item7.html#第3章-移步现代c)

## **Item 7: Distinguish between `()` and `{}` when creating objects**

- 区别赋值运算符和初始化

```cpp
Widget w1;              //调用默认构造函数

Widget w2 = w1;         //不是赋值运算，调用拷贝构造函数

w1 = w2;                //是赋值运算，调用拷贝赋值运算符（copy operator=）
```

### 统一初始化

- C++11使用统一初始化（*uniform initialization*）来整合这些混乱且不适于所有情景的初始化语法

> 统一初始化是指在任何涉及初始化的地方都使用单一的初始化语法，基于花括号
>
> ```cpp
> //使用花括号，创建并指定一个容器的初始元素
> std::vector<int> v{ 1, 3, 5 };  //v初始内容为1,3,5
> 
> //为非静态数据成员指定默认初始值
> class Widget{
>     …
> 
> private:
>     int x{ 0 };                 //没问题，x初始值为0
>     int y = 0;                  //也可以
>     int z(0);                   //错误！
> }
> 
> ```
>
> 一方面，不可拷贝的对象（例如`std::atomic`——见[Item40](https://cntransgroup.github.io/EffectiveModernCppChinese/7.TheConcurrencyAPI/item40.html)）可以使用花括号初始化或者圆括号初始化，但是不能使用"="初始化：
>
> ```cpp
> std::atomic<int> ai1{ 0 };      //没问题
> std::atomic<int> ai2(0);        //没问题
> std::atomic<int> ai3 = 0;       //错误！
> ```
>
> 括号表达式还有一个少见的特性:不允许内置类型间隐式的变窄转换（*narrowing conversion*)，而使用圆括号和"="的初始化不检查是否转换为变窄转换。
>
> ```cpp
> double x, y, z;
> 
> int sum1{ x + y + z };          //错误！double的和可能不能表示为int
> ```
>
> 另一个值得注意的特性：**免疫解析问题**（C++规定任何*可以被解析*为一个声明的东西*必须被解析*为声明）
>
> ```cpp
> Widget w2();                    //最令人头疼的解析！声明一个函数w2，返回Widget
> 
> //函数声明中形参列表不能带花括号，所以使用花括号初始化表明你想调用默认构造函数构造对象
> Widget w3{};   
> ```

---



### 括号初始化的缺点

> [Item2](https://cntransgroup.github.io/EffectiveModernCppChinese/1.DeducingTypes/item2.html)解释了当`auto`声明的变量使用花括号初始化，变量类型会被推导为`std::initializer_list`，但是使用相同内容的其他初始化方式会产生更符合直觉的结果。
>
> - 你越喜欢用`auto`，你就越不能用括号初始化。
>
> 如果有一个或者多个构造函数的声明包含一个`std::initializer_list`形参，那么使用括号初始化语法的调用更倾向于选择带`std::initializer_list`的那个构造函数
>
> ```cpp
> class Widget { 
> public:  
>     Widget(int i, bool b);                              //同之前一样
>     Widget(int i, double d);                            //同之前一样
>     Widget(std::initializer_list<long double> il);      //同之前一样
>     operator float() const;                             //转换为float
>     …
> };
> 
> Widget w1(10, true);    //使用圆括号初始化，同之前一样
>                         //调用第一个构造函数
> 
> Widget w2{10, true};    //使用花括号初始化，但是现在
>                         //调用带std::initializer_list的构造函数
>                         //(10 和 true 转化为long double)
> 
> Widget w3(10, 5.0);     //使用圆括号初始化，同之前一样
>                         //调用第二个构造函数 
> 
> Widget w4{10, 5.0};     //使用花括号初始化，但是现在
>                         //调用带std::initializer_list的构造函数
>                         //(10 和 5.0 转化为long double)
> ```
>
> - 普通构造函数和移动构造函数都会被带`std::initializer_list`的构造函数劫持
>
> ```cpp
> Widget w5(w4);                  //使用圆括号，调用拷贝构造函数
> 
> Widget w6{w4};                  //使用花括号，调用std::initializer_list构造
>                                 //函数（w4转换为float，float转换为double）
> 
> Widget w7(std::move(w4));       //使用圆括号，调用移动构造函数
> 
> Widget w8{std::move(w4)};       //使用花括号，调用std::initializer_list构造
>                                 //函数（与w6相同原因）
> ```
>
> - 就算带`std::initializer_list`的构造函数不能被调用，它也会硬选。
>
> ```cpp
> class Widget { 
> public: 
>     Widget(int i, bool b);                      //同之前一样
>     Widget(int i, double d);                    //同之前一样
>     Widget(std::initializer_list<bool> il);     //现在元素类型为bool
>     …                                           //没有隐式转换函数
> };
> 
> Widget w{10, 5.0};              //错误！要求变窄转换
> 
> ```
>
> 只有当没办法把括号初始化中实参的类型转化为`std::initializer_list`时，编译器才会回到正常的函数决议流程中。
>
> ```cpp
> class Widget { 
> public:  
>     Widget(int i, bool b);                              //同之前一样
>     Widget(int i, double d);                            //同之前一样
>     //现在std::initializer_list元素类型为std::string
>     Widget(std::initializer_list<std::string> il);
>     …                                                   //没有隐式转换函数
> };
> //没有办法把int和bool转换为std::string:
> Widget w1(10, true);     // 使用圆括号初始化，调用第一个构造函数
> Widget w2{10, true};     // 使用花括号初始化，现在调用第一个构造函数
> Widget w3(10, 5.0);      // 使用圆括号初始化，调用第二个构造函数
> Widget w4{10, 5.0};      // 使用花括号初始化，现在调用第二个构造函数
> 
> ```
>
> - 空的花括号意味着没有实参，不是一个空的`std::initializer_list`
>
> ```cpp
> class Widget { 
> public:  
>     Widget();                                   //默认构造函数
>     Widget(std::initializer_list<int> il);      //std::initializer_list构造函数
> 
>     …                                           //没有隐式转换函数
> };
> 
> Widget w1;                      //调用默认构造函数
> Widget w2{};                    //也调用默认构造函数
> Widget w3();                    //最令人头疼的解析！声明一个函数
> 
> //想用空std::initializer来调用std::initializer_list构造函数
> Widget w4({ });                  //使用空花括号列表调用std::initializer_list构造函数
> Widget w5{ { } };                  //同上
> ```

> [!warning]
>
> 1. 如果一堆重载的构造函数中有一个或者多个含有`std::initializer_list`形参，用户代码如果使用了括号初始化，可能只会看到你`std::initializer_list`版本的重载的构造函数。
>
>    最好把你的构造函数设计为不管用户是使用圆括号还是使用花括号进行初始化都不会有什么影响
>
> 2. 认真的在花括号和圆括号之间选择一个来创建对象
>
>    默认使用花括号初始化的开发者主要被适用面广、禁止变窄转换、免疫C++最令人头疼的解析这些优点所吸引。
>
>    

---

### 总结

> [!note]
>
> - 花括号初始化是最广泛使用的初始化语法，它防止变窄转换，并且对于C++最令人头疼的解析有天生的免疫性
> - 在构造函数重载决议中，编译器会尽最大努力将括号初始化与`std::initializer_list`参数匹配，即便其他构造函数看起来是更好的选择
> - 对于数值类型的`std::vector`来说使用花括号初始化和圆括号初始化会造成巨大的不同
> - 在模板类选择使用圆括号初始化或使用花括号初始化创建对象是一个挑战。

---



## **Item 8: Prefer `nullptr` to `0` and `NULL`**

### `0 and NULL`

- 一般来说C++的解析策略是**把`0`看做`int`而不是指针**。
- `0`和`NULL`都不是指针类型。

```cpp
void f(int);        //三个f的重载函数
void f(bool);
void f(void*);

f(0);               //调用f(int)而不是f(void*)

f(NULL);            //可能不会被编译，一般来说调用f(int)，
                    //绝对不会调用f(void*)
```

> `f(NULL)`的不确定行为是由`NULL`的实现不同造成的。

---

### `nullptr`

1. `nullptr`的优点是它**不是整型**，可以把它认为是**所有**类型的指针。
2. `nullptr`的真正类型是`std::nullptr_t`(`std::nullptr_t`可以**隐式转换**为指向任何内置类型的指针)，在一个完美的循环定义以后，`std::nullptr_t`又被定义为`nullptr`。

```cpp
void f(int);        //三个f的重载函数
void f(bool);
void f(void*);
f(nullptr);         //调用重载函数f的f(void*)版本
```

3. 使代码表意明确，尤其是当涉及到与`auto`声明的变量一起使用时。

```cpp
auto result = findRecord( /* arguments */ );
//result的结果一定是指针类型。
if (result == nullptr) {  
    …
}
```

4. 模板里的`nullptr`

   > ```cpp
   > int    f1(std::shared_ptr<Widget> spw);     //只能被合适的
   > double f2(std::unique_ptr<Widget> upw);     //已锁互斥量
   > bool   f3(Widget* pw);                      //调用
   > 
   > template<typename FuncType,
   >          typename MuxType,
   >          typename PtrType>
   > decltype(auto) lockAndCall(FuncType func,       //C++14
   >                            MuxType& mutex,
   >                            PtrType ptr)
   > { 
   >     MuxGuard g(mutex);  
   >     return func(ptr); 
   > }
   > 
   > auto result1 = lockAndCall(f1, f1m, 0);         //错误！
   > ...
   > auto result2 = lockAndCall(f2, f2m, NULL);      //错误！
   > ...
   > auto result3 = lockAndCall(f3, f3m, nullptr);   //没问题
   > 
   > ```
   >
   > 1. 当`nullptr`传给`lockAndCall`时，`ptr`被推导为`std::nullptr_t`。当`ptr`被传递给`f3`的时候，隐式转换使`std::nullptr_t`转换为`Widget*`，因为`std::nullptr_t`可以隐式转换为任何指针类型。
   > 2. 模板类型推导将`0`和`NULL`推导为一个错误的类型（即它们的实际类型，而不是作为空指针的隐含意义）
   >
   > - 想用一个**空指针**，使用`nullptr`，不用`0`或者`NULL`。

### 总结

> [!note]
>
> - 优先考虑`nullptr`而非`0`和`NULL`
> - 避免重载指针和整型

---

## **Item 9: Prefer alias declarations to `typedef`**

### `typedef and using`

- `typedef`是C++98的东西

```cpp
typedef
    std::unique_ptr<std::unordered_map<std::string, std::string>>
    UPtrMapSS; 
```

- C++11也提供了一个**别名声明**（*alias declaration*）：`using 声明`

```cpp
using UPtrMapSS =
    std::unique_ptr<std::unordered_map<std::string, std::string>>;
```

1. 声明一个函数指针时别名声明更容易理解：

```cpp
//FP是一个指向函数的指针的同义词，它指向的函数带有
//int和const std::string&形参，不返回任何东西
typedef void (*FP)(int, const std::string&);    //typedef

//含义同上
using FP = void (*)(int, const std::string&);   //别名声明
```

2. 别名声明可以被**模板化**（这种情况下称为别名模板*alias template*s）但是`typedef`不能

> 当编译器处理`Widget`模板时遇到`MyAllocList<T>`（使用模板别名声明的版本），它们知道`MyAllocList<T>`是一个类型名，因为`MyAllocList`是一个别名模板：它**一定**是一个类型名。
>
> 但是如果使用`typedef`编译器不能确定`MyAllocList<T>::type`是一个类型而非特化版本的数据成员
>
> ```cpp
> template<typename T> 
> using MyAllocList = std::list<T, MyAlloc<T>>;   //同之前一样
> 
> template<typename T> 
> class Widget {
> private:
>     MyAllocList<T> list;                        //没有“typename”
>     …                                           //没有“::type”
> };
> ```

---



### `<type_traits>`

-  C++11在*type traits*（类型特性）中给了你一系列工具去实现类型转换，些模板请包含头文件`<type_traits>`
- C++11的*type traits*是通过在`struct`内嵌套`typedef`来实现的
- C++14才提供了使用别名声明的版本

```cpp
std::remove_const<T>::type          //C++11: const T → T 
std::remove_const_t<T>              //C++14 等价形式

std::remove_reference<T>::type      //C++11: T&/T&& → T 
std::remove_reference_t<T>          //C++14 等价形式

std::add_lvalue_reference<T>::type  //C++11: T → T& 
std::add_lvalue_reference_t<T>      //C++14 等价形式

```

---



### 总结

> [!note]
>
> - `typedef`不支持模板化，但是别名声明支持。
> - 别名模板避免了使用“`::type`”后缀，而且在模板中使用`typedef`还需要在前面加上`typename`
> - C++14提供了C++11所有*type traits*转换的别名声明版本

---

## **Item 10: Prefer scoped `enum`s to unscoped `enum`s**

### (*unscoped `enum`*)and (*scoped `enum`*)

- 通常来说，在花括号中声明一个名字会限制它的作用域在花括号之内。

- C++98风格的`enum`中声明的枚举名的名字属于包含这个`enum`的作用域

  > ```cpp
  > enum Color { black, white, red };   //black, white, red在
  >                                     //Color所在的作用域
  > auto white = false;                 //错误! white早已在这个作用
  >                                     //域中声明
  > ```
  >
  > 这些枚举名的名字泄漏进它们所被定义的`enum`在的那个作用域:**未限域枚举(*unscoped `enum`*)**

- 一个相似物，限域枚举(*scoped `enum`*):

  > ```cpp
  > enum class Color { black, white, red }; //black, white, red
  >                                         //限制在Color域内
  > auto white = false;                     //没问题，域内没有其他“white”
  > 
  > Color c = white;                        //错误，域中没有枚举名叫white
  > 
  > Color c = Color::white;                 //没问题
  > auto c = Color::white;                  //也没问题（也符合Item5的建议）
  > ```
  >
  > 限域`enum`是通过“`enum class`”声明，所以它们有时候也被称为**枚举类**(*`enum` classes*)。

### 枚举类

1. 使用限域`enum`来**减少命名空间污染**

2. 在它的作用域中，枚举名是**强类型**。

   > - 未限域`enum`中的枚举名会隐式转换为整型（现在，也可以转换为浮点类型）
   >
   > ```cpp
   > enum Color { black, white, red };       //未限域enum
   > 
   > std::vector<std::size_t>                //func返回x的质因子
   >   primeFactors(std::size_t x);
   > 
   > Color c = red;
   > …
   > 
   > if (c < 14.5) {                         // Color与double比较 (!)
   >     auto factors =                      // 计算一个Color的质因子(!)
   >       primeFactors(c);
   >     …
   > }
   > ```
   >
   > - 不存在任何隐式转换可以将限域`enum`中的枚举名转化为任何其他类型
   >
   > ```cpp
   > enum class Color { black, white, red }; //Color现在是限域enum
   > 
   > Color c = Color::red;                   //和之前一样，只是
   > ...                                     //多了一个域修饰符
   > 
   > if (c < 14.5) {                         //错误！不能比较
   >                                         //Color和double
   >     auto factors =                      //错误！不能向参数为std::size_t
   >       primeFactors(c);                  //的函数传递Color参数
   >     …
   > }
   > 
   > ```
   >
   > - 使用正确的类型转换运算符扭曲类型系统执行`Color`到其他类型的转换
   >
   > ```cpp
   > if (static_cast<double>(c) < 14.5) {    //奇怪的代码，
   >                                         //但是有效
   >     auto factors =                                  //有问题，但是
   >       primeFactors(static_cast<std::size_t>(c));    //能通过编译
   >     …
   > }
   > ```

3. 限域`enum`可以被前置声明，减少编译依赖

   > ```cpp
   > enum Color;         //错误！
   > enum class Color;   //没问题
   > ```
   >
   > 在C++11中，非限域`enum`也可以被前置声明:在C++中所有的`enum`都有一个由编译器决定的整型的底层类型
   >
   > C++11中的前置声明`enum`s可以减少编译依赖
   >
   > ```cpp
   > enum class Status;                  //前置声明
   > void continueProcessing(Status s);  //使用前置声明enum
   > ```
   >
   > 即使`Status`的定义发生改变，包含这些声明的头文件也不需要重新编译

4. 限域`enum`的底层类型总是已知的，而对于非限域`enum`，你可以指定它。

   > ```cpp
   > enum class Status: std::uint32_t;   //Status的底层类型
   >                                     //是std::uint32_t
   >                                     //（需要包含 <cstdint>）
   > ```
   >
   > 底层类型说明也可以放到`enum`定义处。

5. 限域`enum`并非万事皆宜

   > [!warning]
   >
   > 牵扯到C++11的`std::tuple`的时候
   >
   > ```cpp
   > UserInfo uInfo;                 //tuple对象
   > …
   > auto val = std::get<1>(uInfo);	//获取第一个字段
   > 
   > //非限域
   > enum UserInfoFields { uiName, uiEmail, uiReputation };
   > UserInfo uInfo;                         //同之前一样
   > //UserInfoFields中的枚举名隐式转换成std::size_t
   > auto val = std::get<uiEmail>(uInfo);    //啊，获取用户email字段的值
   > 
   > //限域
   > enum class UserInfoFields { uiName, uiEmail, uiReputation };
   > 
   > UserInfo uInfo;                         //同之前一样
   > …
   > auto val =
   >     std::get<static_cast<std::size_t>(UserInfoFields::uiEmail)>
   >         (uInfo);
   > ```
   >
   > - 为避免这种冗长的表示，我们可以写一个函数传入枚举名并返回对应的`std::size_t`值
   >
   >   ```cpp
   >   template<typename E>                //C++14
   >   constexpr auto
   >       toUType(E enumerator) noexcept
   >   {
   >       return static_cast<std::underlying_type_t<E>>(enumerator);
   >   }
   >   ```

### 总结

> [!note]
>
> - C++98的`enum`即非限域`enum`。
> - 限域`enum`的枚举名仅在`enum`内可见。要转换为其它类型只能使用*cast*。
> - 非限域/限域`enum`都支持底层类型说明语法，限域`enum`底层类型默认是`int`。非限域`enum`没有默认底层类型。
> - 限域`enum`总是可以前置声明。非限域`enum`仅当指定它们的底层类型时才能前置。

---

## **Item 11: Prefer deleted functions to private undefined ones.**

### `delete`

- 在C++98中，想要**禁止使用的成员函数**，几乎总是拷贝构造函数或者赋值运算符，或者两者都是。防止调用这些函数的方法是将它们**声明为私有**（`private`）成员函数并且**不定义**

  > 所有*istream*和*ostream*类都继承此模板类`basic_ios`（直接或者间接)
  >
  > `basic_ios`在C++98中是这样声明的（包括注释）：
  >
  > ```cpp
  > template <class charT, class traits = char_traits<charT> >
  > class basic_ios : public ios_base {
  > public:
  >     …
  > 
  > private:
  >     //使这些istream和ostream类不可拷贝
  >     basic_ios(const basic_ios& );           // not defined
  >     basic_ios& operator=(const basic_ios&); // not defined
  > };
  > ```
  >
  > 有代码用它们（比如成员函数或者类的友元`friend`），就会在链接时引发缺少函数定义（*missing function definitions*）错误。

- 在C++11中，用“`= delete`”将拷贝构造函数和拷贝赋值运算符标记为***deleted\*函数**

  > ```cpp
  > template <class charT, class traits = char_traits<charT> >
  > class basic_ios : public ios_base {
  > public:
  >     …
  > 
  >     basic_ios(const basic_ios& ) = delete;
  >     basic_ios& operator=(const basic_ios&) = delete;
  >     …
  > };
  > ```
  >
  > *deleted*函数**不能以任何方式被调用**，即使你在成员函数或者友元函数里面调用*deleted*函数也不能通过编译

- **任何**函数（包含普通函数和成员函数等所有可声明函数的地方）都可以标记为*deleted*，而只有成员函数可被标记为`private`

  > ```cpp
  > //假如我们有一个非成员函数，它接受一个整型参数，检查它是否为幸运数
  > bool isLucky(int number);
  > ```
  >
  > 能被视作数值的任何类型都能隐式转换为`int`，所以
  >
  > ```cpp
  > if (isLucky('a')) …         //字符'a'是幸运数？
  > if (isLucky(true)) …        //"true"是?
  > if (isLucky(3.5)) …         //难道判断它的幸运之前还要先截尾成3？
  > ```
  >
  > 创建*deleted*重载函数，禁止这些调用通过编译。
  >
  > ```cpp
  > bool isLucky(int number);       //原始版本
  > bool isLucky(char) = delete;    //拒绝char
  > bool isLucky(bool) = delete;    //拒绝bool
  > bool isLucky(double) = delete;  //拒绝float和double
  > ```

- *deleted* **禁止一些模板的实例化**

  > 假如你要求一个模板仅支持原生指针（尽管[第四章](https://cntransgroup.github.io/EffectiveModernCppChinese/4.SmartPointers/item18.html)建议使用智能指针代替原生指针）：
  >
  > ```cpp
  > template<typename T>
  > void processPointer(T* ptr);
  > ```
  >
  > 指针的世界里有两种特殊情况
  >
  > 1. **`void*`指针**，因为没办法对它们进行解引用，或者加加减减等
  > 2. **`char*`**，因为它们通常代表C风格的字符串，而不是正常意义下指向单个字符的指针
  >
  > `processPointer`不能被`void*`和`char*`调用
  >
  > ```cpp
  > template<>
  > void processPointer<void>(void*) = delete;
  > 
  > template<>
  > void processPointer<char>(char*) = delete;
  > //const void*和const char*也应该无效，所以这些实例也应该标注delete:
  > template<>
  > void processPointer<const void>(const void*) = delete;
  > 
  > template<>
  > void processPointer<const char>(const char*) = delete;
  > ```
  >
  > > [!tip]
  > >
  > > 做得更彻底一些，你还要删除`const volatile void*`和`const volatile char*`重载版本，另外还需要一并删除其他标准字符类型的重载版本：`std::wchar_t`，`std::char16_t`和`std::char32_t`
  >
  > - 用`private`（经典的C++98惯例）来禁止这些函数模板实例化
  >
  >   ```cpp
  >   class Widget {
  >   public:
  >       …
  >       template<typename T>
  >       void processPointer(T* ptr)
  >       { … }
  >           
  >   private:
  >       //模板特例化必须位于一个命名空间作用域，而不是类作用域。
  >       template<>                          //错误！
  >       void processPointer<void>(void*);
  >               
  >   };
  >   ```

---

### 总结

> [!note]
>
> - 比起声明函数为`private`但不定义，使用*deleted*函数更好
> - 任何函数都能被删除（be deleted），包括非成员函数和模板实例（译注：实例化的函数）

---



## **Item 12: Declare overriding functions `override`**

### `override`

- 最基本的概念是派生类的虚函数**重写**基类同名函数

  > ```cpp
  > class Base {
  > public:
  >     virtual void doWork();          //基类虚函数
  >     …
  > };
  > 
  > class Derived: public Base {
  > public:
  >     virtual void doWork();          //重写Base::doWork
  >     …                               //（这里“virtual”是可以省略的）
  > }; 
  > 
  > std::unique_ptr<Base> upb =         //创建基类指针指向派生类对象
  >     std::make_unique<Derived>();    //关于std::make_unique
  > …                                   //请参见Item21
  > 
  >     
  > upb->doWork();                      //通过基类指针调用doWork，
  >                                     //实际上是派生类的doWork
  >                                     //函数被调用
  > ```
  >
  > 重写一个函数：
  >
  > 1. 基类函数必须是**`virtual`**
  >
  > 2. 基类和派生类**函数名必须完全一样（除非是析构函数)**
  >
  > 3. 基类和派生类函数**形参类型**必须完全一样
  >
  > 4. 基类和派生类函数**常量性`const`ness**必须完全一样
  >
  > 5. 基类和派生类函数的**返回值和异常说明**（*exception specifications*）必须兼容
  >
  > 6. 函数的**引用限定符**（*reference qualifiers*）必须完全一样（C++11）。
  >
  >    ```cpp
  >    class Widget {
  >    public:
  >        …
  >        void doWork() &;    //只有*this为左值的时候才能被调用
  >        void doWork() &&;   //只有*this为右值的时候才能被调用
  >    }; 
  >    …
  >    Widget makeWidget();    //工厂函数（返回右值）
  >    Widget w;               //普通对象（左值）
  >    …
  >    w.doWork();             //调用被左值引用限定修饰的Widget::doWork版本
  >                            //（即Widget::doWork &）
  >    makeWidget().doWork();  //调用被右值引用限定修饰的Widget::doWork版本
  >                            //（即Widget::doWork &&）
  >    ```

- 所有重写函数后面加上`override`。

  > ```cpp
  > class Base {
  > public:
  >     virtual void mf1() const;
  >     virtual void mf2(int x);
  >     virtual void mf3() &;
  >     virtual void mf4() const;
  > };
  > 
  > class Derived: public Base {
  > public:
  >     virtual void mf1() const override;
  >     virtual void mf2(int x) override;
  >     virtual void mf3() & override;
  >     void mf4() const override;          //可以添加virtual，但不是必要
  > }; 
  > ```
  >
  > 1. 给你的派生类重写函数全都加上`override`
  > 2. `override`还可以帮你评估后果
  > 3. 对于`override`，它只在**成员函数声明结尾处**才被视为关键字。

---



### `final`

- 向虚函数添加`final`可以防止派生类重写。
- `final`也能用于类，这时这个类不能用作基类

---



### 成员函数引用限定（*reference qualifiers*）

```cpp
//写一个函数只接受左值实参，声明一个non-const左值引用形参
void doSomething(Widget& w);    //只接受左值Widget对象

//只接受右值实参，声明一个右值引用形参
void doSomething(Widget&& w);   //只接受右值Widget对象
```

- 引用限定可以很容易的区分一个成员函数被哪个对象（即`*this`）调用s

- 指明当`data`被右值`Widget`对象调用的时候结果也应该是一个右值。现在就可以使用引用限定，为左值`Widget`和右值`Widget`写一个`data`的重载函数来达成这一目的：

  ```cpp
  class Widget {
  public:
      using DataType = std::vector<double>;
      …
      DataType& data() &              //对于左值Widgets,
      { return values; }              //返回左值
      
      DataType data() &&              //对于右值Widgets,
      { return std::move(values); }   //返回右值
      …
  
  private:
      DataType values;
  };
  ```

---

### 总结

> [!note]
>
> - 为重写函数加上`override`
> - 成员函数引用限定让我们可以区别对待左值对象和右值对象（即`*this`)

---



## **Item 13: Prefer `const_iterators` to `iterators`**

### `const_iterator`

- STL `const_iterator`等价于指向常量的指针（pointer-to-`const`）
- 实践是能加上`const`就加上

> 假如你想在`std::vector<int>`中查找第一次出现1983（C++代替C with classes的那一年）的位置，然后插入1998（第一个ISO C++标准被接纳的那一年）。如果*vector*中没有1983，那么就在*vector*尾部插入。
>
> 1. C++98
>
>    ```cpp
>    typedef std::vector<int>::iterator IterT;               //typedef
>    typedef std::vector<int>::const_iterator ConstIterT;
>    
>    std::vector<int> values;
>    …
>    //用const_iterator重写这段代码
>    ConstIterT ci =
>        std::find(static_cast<ConstIterT>(values.begin()),  //cast
>                  static_cast<ConstIterT>(values.end()),    //cast
>                  1983);
>    
>    values.insert(static_cast<IterT>(ci), 1998);    //可能无法通过编译，
>                                                    //原因见下
>    ```
>
> 2. C++11：容器的成员函数`cbegin`和`cend`产出`const_iterator`，甚至对于non-`const`容器也可用
>
>    ```cpp
>    std::vector<int> values;                                //和之前一样
>    …
>    auto it =                                               //使用cbegin
>        std::find(values.cbegin(), values.cend(), 1983);//和cend
>    values.insert(it, 1998);
>    ```

- C++14支持但是C++11的时候还没：

  - 想写最大程度通用的库，并且这些库代码为一些容器和类似容器的数据结构提供`begin`、`end`（以及`cbegin`，`cend`，`rbegin`，`rend`等）作为**非成员函数**而不是成员函数
  - 原生数组，还有一种情况是一些只由自由函数组成接口的第三方库

- 非成员函数`cbegin`的实现:

  > ```cpp
  > template <class C>
  > auto cbegin(const C& container)->decltype(std::begin(container))
  > {
  >     return std::begin(container);   //解释见下
  > }
  > ```
  >
  > 1. 这个`cbegin`模板接受任何代表类似容器的数据结构的实参类型`C`
  > 2. 通过reference-to-`const`形参`container`访问这个实参
  > 3. 对`const`容器调用非成员函数`begin`（由C++11提供）将产出`const_iterator`

- 非成员函数`cend`的实现:同理

  > ```cpp
  > template <class C>
  > auto cend(const C& container)->decltype(std::end(container))
  > {
  >     return std::end(container);   //解释见下
  > }
  > ```

### 总结

> [!note]
>
> - 优先考虑`const_iterator`而非`iterator`
> - 在最大程度通用的代码中，优先考虑非成员函数版本的`begin`，`end`，`rbegin`等，而非同名成员函数

---



## **Item 14: Declare functions `noexcept` if they won’t emit exceptions**

### `noexcept`

- 在C++98中，异常说明（*exception specifications*）是喜怒无常的野兽

  > 不得不写出函数可能抛出的异常类型
  >
  > 如果函数实现有所改变，异常说明也可能需要修改
  >
  > 同时改变异常说明会影响客户端代码

- 在C++11标准化过程中，异常说明真正有用的信息是**一个函数是否会抛出异常**

  > 一个函数可能抛异常，或者不会

- 在C++11中，无条件的`noexcept`保证函数**不会抛出任何异常。**

  > 1. 一个函数是否已经声明为`noexcept`是接口设计的事
  > 2. 函数的**异常抛出行为**是客户端代码最关心的
  > 3. 调用者可以查看函数是否声明为`noexcept`，这个可以影响到调用代码的异常安全性（*exception safety*）和效率

- 给不抛异常的函数加上`noexcept`的动机：它**允许编译器生成更好的目标代码**

  > ```cpp
  > //函数f，它保证调用者永远不会收到一个异常
  > int f(int x) throw();   //C++98风格，没有来自f的异常
  > int f(int x) noexcept;  //C++11风格，没有来自f的异常
  > ```
  >
  > - 在运行时，`f`出现一个异常
  >   - C++98的异常说明中，用栈（the *call stack*）会展开至`f`的调用者，在一些与这地方不相关的动作后，程序被终止
  >   - C++11异常说明中，调用栈只是**可能**在程序终止前展开

---



### 展开调用栈和**可能**展开调用栈

展开调用栈和**可能**展开调用栈两者对于**代码生成**（code generation）有非常大的影响

- 在一个`noexcept`函数中，当异常可能传播到函数外时
  - 优化器不需要保证运行时栈（the runtime stack）处于可展开状态
  - 不需要保证当异常离开`noexcept`函数时，`noexcept`函数中的对象按照构造的反序析构

> ```cpp
> std::vector<Widget> vw;
> …
> Widget w;
> …                   //用w做点事
> vw.push_back(w);    //把w添加进vw
> ```
>
> - `std::vector::push_back`受益于“如果可以就移动，如果必要则复制”策略
>   - `std::vector`的大小（size）等于它的容量（capacity）。这时候，`std::vector`会分配一个新的更大块的内存用于存放其中元素，然后将元素从老内存区**移动**到新内存区，然后析构老内存区里的对象。
>   - 这种方法使得`push_back`可以提供很强的异常安全保证：如果在复制元素期间**抛出异常，`std::vector`状态保持不变**
>   - 在C++11中，一个很自然的优化就是将上述复制操作替换为移动操作，这会破坏`push_back`的异常安全保证

---



### `swap`

- `swap`函数是`noexcept`的另一个绝佳用地。
- `swap`是STL算法实现的一个关键组件，它也常用于拷贝运算符重载中
- 标准库的`swap`是否`noexcept`有时依赖于用户定义的`swap`是否`noexcept`

> 数组和`std::pair`的`swap`声明如下
>
> ```cpp
> template <class T, size_t N>
> void swap(T (&a)[N],
>           T (&b)[N]) noexcept(noexcept(swap(*a, *b)));  //见下文
> 
> template <class T1, class T2>
> struct pair {
>     …
>     void swap(pair& p) noexcept(noexcept(swap(first, p.first)) &&
>                                 noexcept(swap(second, p.second)));
>     …
> };
> ```
>
> 这些函数**视情况**`noexcept`：它们是否`noexcept`依赖于`noexcept`声明中的表达式是否`noexcept`。
>
> **事实上交换高层次数据结构是否`noexcept`取决于它的构成部分的那些低层次数据结构是否`noexcept`**

---

### 异常中立

- 仅当你保证一个函数实现在长时间内不会抛出异常时才声明`noexcept`。

- 大多数函数都是异常中立（*exception-neutral*）的

  > 这些函数自己不抛异常，但是它们**内部的调用可能抛出异常**。
  >
  > 异常中立函数允许那些抛出异常的函数在**调用链**上更进一步直到遇到**异常处理程序**，而不是就地终止。

- 异常中立函数决不应该声明为`noexcept`

- 为了`noexcept`而扭曲函数实现来达成目的是本末倒置

  > 为了讨好调用者隐藏了这个（比如捕获所有异常，然后替换为状态码或者特殊返回值），这不仅会使你的函数实现变得复杂，还会让调用点的代码变得复杂
  >
  > 调用者可能不得不检查状态码或特殊返回值

- 一些函数，使其成为`noexcept`是很重要的

  > 在C++98，允许内存释放（memory deallocation）函数（即`operator delete`和`operator delete[]`）和析构函数抛出异常是糟糕的代码设计
  >
  > C++11，默认情况下，**内存释放函数和析构函数**——不管是用户定义的还是编译器生成的——都是隐式`noexcept`
  >
  > > [!tip]
  > >
  > > 析构函数非隐式`noexcept`的情况：
  > >
  > > 仅当类的数据成员（包括继承的成员还有继承成员内的数据成员）明确声明它的析构函数可能抛出异常（如声明“`noexcept(false)`”）

---



### 宽泛契约（**wild contracts**）和严格契约（**narrow contracts**）

- 有宽泛契约的函数没有前置条件

  > 这种函数不管程序状态如何都能调用，它对调用者传来的实参不设约束
  >
  > “不管程序状态如何”和“不设约束”对已经行为未定义的程序无效:
  >
  > 宽泛契约的函数决不表现出未定义行为。

- 没有宽泛契约的函数就有严格契约

  > 这些函数，如果违反前置条件，结果将会是未定义的。

- 区分严格/宽泛契约库设计者一般会将`noexcept`留给宽泛契约函数

---

### 总结

> [!note]
>
> - `noexcept`是**函数接口**的一部分，这意味着调用者可能会依赖它
> - `noexcept`函数较之于non-`noexcept`函数更**容易优化**
> - `noexcept`对于移动语义，`swap`，内存释放函数和析构函数非常有用
> - 大多数函数是异常中立的（译注：可能抛也可能不抛异常）而不是`noexcept`

---



## **Item 15: Use `constexpr` whenever possible**

### `constexpr`

- 当用于对象上面，`constexpr`本质上就是`const`的加强形式

- 从概念上来说，`constexpr`表明一个值不仅仅是常量，还是编译期可知的。

  > 你不能假设`constexpr`函数的结果是`const`，也不能保证它们的（译注：返回）值是在编译期可知的。

- 关于`constexpr`函数返回的结果不需要是`const`，也不需要编译期可知这一点是**良好的**行为！

---



### `constexpr`对象

- 这些`constexpr`对象，实际上，和`const`一样，它们是编译期可知的。

  > 技术上来讲，它们的值在**翻译期（translation）决议**，所谓翻译不仅仅包含是编译（compilation）也包含链接（linking)

- 编译期可知的值“享有特权”，它们可能被存放到**只读存储空间**中。

  > “其值编译期可知”的常量整数会出现在需要“整型常量表达式（**integral constant expression**）的上下文中
  >
  > 包括数组大小，整数模板参数（包括`std::array`对象的长度），枚举名的值，对齐修饰符（译注：[`alignas(val)`](https://en.cppreference.com/w/cpp/language/alignas)），等等
  >
  > ```cpp
  > int sz;                             //non-constexpr变量
  > …
  > constexpr auto arraySize1 = sz;     //错误！sz的值在
  >                                     //编译期不可知
  > std::array<int, sz> data1;          //错误！一样的问题
  > constexpr auto arraySize2 = 10;     //没问题，10是
  >                                     //编译期可知常量
  > std::array<int, arraySize2> data2;  //没问题, arraySize2是constexpr
  > ```

- 所有`constexpr`对象都是`const`，但不是所有`const`对象都是`constexpr`

  > 想编译器保证一个变量有一个值可以放到那些需要编译期常量（compile-time constants）的上下文的地方，你需要的工具是`constexpr`而不是`const`

---



### `constexpr`函数

- 如果实参是编译期常量，这些函数将产出编译期常量

- 如果实参是运行时才能知道的值，它们就将产出运行时值

  > 1. `constexpr`函数可以用于需求编译期常量的上下文。如果你传给`constexpr`函数的实参在编译期可知，那么结果将在编译期计算。
  > 2. 当一个`constexpr`函数被一个或者多个编译期不可知值调用时，它就像普通函数一样，运行时计算它的结果。

- pow

  > 1. 存所有实验结果的所有组合需要足够存放3n个值的数据结构。假设每个结果都是`int`并且**n**是编译期已知的（或者可以被计算出的）
  > 2. 我们需要一个方法在编译期计算3n，但是这里有两个问题
  >    1. `std::pow`是为浮点类型设计的，我们需要整型结果。
  >    2. `std::pow`不是`constexpr`（即，不保证使用编译期可知值调用而得到编译期可知的结果），所以我们不能用它作为`std::array`的大小
  >
  > ```cpp
  > constexpr                                   //pow是绝不抛异常的
  > int pow(int base, int exp) noexcept         //constexpr函数
  > {
  >  …                                          //实现在下面
  > }
  > constexpr auto numConds = 5;                //（上面例子中）条件的个数
  > std::array<int, pow(3, numConds)> results;  //结果有3^numConds个元素
  > 
  > ```
  >
  > `pow`不止可以用于像`std::array`的大小这种需要编译期常量的地方，它也可以用于运行时环境

  ---

  ### `constexpr`函数限制

  - C++11中，`constexpr`函数的代码不超过一行语句：一个`return`。

    > 有两个技巧可以扩展`constexpr`函数的表达能力
    >
    > 1. 使用三元运算符“`?:`”来代替`if`-`else`语句
    > 2. 使用递归代替循环
    >
    > ```cpp
    > constexpr int pow(int base, int exp) noexcept
    > {
    >     return (exp == 0 ? 1 : base * pow(base, exp - 1));
    > }
    > ```

  - 在C++14中，`constexpr`函数的限制变得非常宽松

    > ```cpp
    > constexpr int pow(int base, int exp) noexcept   //C++14
    > {
    >     auto result = 1;
    >     for (int i = 0; i < exp; ++i) result *= base;
    >     
    >     return result;
    > }
    > ```

  - `constexpr`函数限制为只能获取和返回**字面值类型**

    > 在C++11中，除了`void`外的所有内置类型，以及**一些用户定义类型都可以是字面值类型**，因为构造函数和其他成员函数可能是`constexpr`
    >
    > ```cpp
    > class Point {
    > public:
    >     constexpr Point(double xVal = 0, double yVal = 0) noexcept
    >     : x(xVal), y(yVal)
    >     {}
    > 
    >     constexpr double xValue() const noexcept { return x; } 
    >     constexpr double yValue() const noexcept { return y; }
    > 
    >     void setX(double newX) noexcept { x = newX; }
    >     void setY(double newY) noexcept { y = newY; }
    > 
    > private:
    >     double x, y;
    > };
    > ```
    >
    > 类似的，`xValue`和`yValue`的*getter*（取值器）函数也能是`constexpr`，这使得我们可以写一个`constexpr`函数，里面调用`Point`的*getter*并初始化`constexpr`的对象：
    >
    > ```cpp
    > constexpr
    > Point midpoint(const Point& p1, const Point& p2) noexcept
    > {
    >     return { (p1.xValue() + p2.xValue()) / 2,   //调用constexpr
    >              (p1.yValue() + p2.yValue()) / 2 }; //成员函数
    > }
    > constexpr auto mid = midpoint(p1, p2);      //使用constexpr函数的结果
    >                                             //初始化constexpr对象
    > ```
    >
    > 意味着以前相对严格的编译期完成的工作和运行时完成的工作的界限变得模糊，一些传统上在运行时的计算过程能并入编译时。越多这样的代码并入，你的程序就越快。（然而，编译会花费更长时间）
    >
    > > [!warning]
    > >
    > > 在C++11中，有两个限制使得`Point`的成员函数`setX`和`setY`不能声明为`constexpr`
    > >
    > > 1. 它们修改它们操作的对象的状态， 并且在C++11中，`constexpr`成员函数是隐式的`const`
    > > 2. `void`类型不是C++11中的字面值类型。

---

### 总结

> [!note]
>
> - `constexpr`对象是`const`，它被在编译期可知的值初始化
> - 当传递编译期可知的值时，`constexpr`函数可以产出编译期可知的结果
> - `constexpr`对象和函数可以使用的范围比non-`constexpr`对象和函数要大
> - `constexpr`是对象和函数接口的一部分

---



## **Item 16: Make `const` member functions thread safe**

### `const`成员函数

```cpp
class Polynomial {
public:
    using RootsType =           //数据结构保存多项式为零的值
          std::vector<double>;  //（“using” 的信息查看条款9）
    …
    RootsType roots() const;
    …
};
```

- 这样的一个函数它不会更改多项被声明为`const`函数。

- 缓存多项式的根，然后实现`roots`来返回缓存的值

  > ```cpp
  > class Polynomial {
  > public:
  >     using RootsType = std::vector<double>;
  >     
  >     RootsType roots() const
  >     {
  >         if (!rootsAreValid) {               //如果缓存不可用
  >             …                               //计算根
  >                                             //用rootVals存储它们
  >             rootsAreValid = true;
  >         }
  >         
  >         return rootVals;
  >     }
  >     
  > private:
  >     //mutable的经典使用样例,在被const修饰的函数里面也能被修改。
  >     mutable bool rootsAreValid{ false };    //初始化器（initializer）的
  >     mutable RootsType rootVals{};           //更多信息请查看条款7
  > };
  > ```
  >
  > > [!warning]
  > >
  > > `mutable`关键词
  > >
  > > 1. mutable只能作用在类成员上，指示其数据总是可变的。
  > > 2. const修饰的方法（常成员函数）中，mutable修饰的成员数据可以发生改变

- 假设现在有两个线程同时调用`Polynomial`对象的`roots`方法:

> ```cpp
> Polynomial p;
> …
> 
> /*------ Thread 1 ------*/      /*-------- Thread 2 --------*/
> auto rootsOfp = p.roots();      auto valsGivingZero = p.roots();
> ```
>
> 这些线程中的一个或两个可能尝试修改成员变量`rootsAreValid`和`rootVals`。
>
> 没有同步的情况下，这些代码会有不同的线程读写相同的内存，这就是数据竞争（*data race*）的定义
>
> 问题就是`roots`被声明为`const`，但不是线程安全的。

- 解决这个问题最普遍简单的方法就是——使用`mutex`（互斥量）：

> ```cpp
> class Polynomial {
> public:
>     using RootsType = std::vector<double>;
>     
>     RootsType roots() const
>     {
>         //自动管理互斥锁的机制，确保互斥锁在作用域结束时自动释放
>         std::lock_guard<std::mutex> g(m);       //锁定互斥量
>         
>         if (!rootsAreValid) {                   //如果缓存无效
>             …                                   //计算/存储根值
>             rootsAreValid = true;
>         }
>         
>         return rootsVals;
>     }                                           //解锁互斥量
>     
> private:
>     mutable std::mutex m;
>     mutable bool rootsAreValid { false };
>     mutable RootsType rootsVals {};
> };
> ```
>
> - `std::mutex` 既不可移动，也不可复制。因而包含他们的类也同时是不可移动和不可复制的。
> - 

- 如果你所做的只是计算成员函数被调用了多少次，使用`std::atomic` 修饰的计数器

  > 开销更小
  >
  > ```cpp
  > class Point {                                   //2D点
  > public:
  >     …
  >     double distanceFromOrigin() const noexcept  //noexcept的使用
  >     {                                           //参考条款14
  >         ++callCount;                            //atomic的递增
  >         
  >         return std::sqrt((x * x) + (y * y));
  >     }
  > 
  > private:
  >     mutable std::atomic<unsigned> callCount{ 0 };
  >     double x, y;
  > };
  > ```
  >
  > 实际上 `std::atomic` 既不可移动，也不可复制
  >
  > 因为对`std::atomic`变量的操作通常比互斥量的获取和释放的消耗更小，所以你可能会过度倾向与依赖`std::atomic`

- 在一个类中，缓存一个开销昂贵的`int`，你就会尝试使用一对`std::atomic`变量而不是互斥量。

  > ```cpp
  > class Widget {
  > public:
  >     …
  >     int magicValue() const
  >     {
  >         if (cacheValid) return cachedValue;
  >         else {
  >             auto val1 = expensiveComputation1();
  >             auto val2 = expensiveComputation2();
  >             cachedValue = val1 + val2;              //第一步
  >             cacheValid = true;                      //第二步
  >             return cachedValid;
  >         }
  >     }
  >     
  > private:
  >     mutable std::atomic<bool> cacheValid{ false };
  >     mutable std::atomic<int> cachedValue;
  > };
  > 
  > ```
  >
  > 难以避免有时出现**重复计算**的情况:
  >
  > 1. 一个线程调用`Widget::magicValue`，将`cacheValid`视为`false`，执行这两个昂贵的计算，并将它们的和分配给`cachedValue`。
  > 2. 第二个线程调用`Widget::magicValue`，也将`cacheValid`视为`false`，因此执行刚才完成的第一个线程**相同的计算**。（这里的“第二个线程”实际上可能是其他**几个**线程。）
  >
  > - 将`cachedValue`和`CacheValid`的赋值顺序交换可以解决这个问题，但结果会更糟：
  >
  > ```cpp
  > class Widget {
  > public:
  >     …
  >     int magicValue() const
  >     {
  >         if (cacheValid) return cachedValue;
  >         else {
  >             auto val1 = expensiveComputation1();
  >             auto val2 = expensiveComputation2();
  >             cacheValid = true;                      //第一步
  >             return cachedValue = val1 + val2;       //第二步
  >         }
  >     }
  >     …
  > }
  > ```
  >
  > 1. 一个线程调用`Widget::magicValue`，刚执行完将`cacheValid`设置`true`的语句。
  > 2. 在这时，第二个线程调用`Widget::magicValue`，检查`cacheValid`。看到它是`true`，就返回`cacheValue`，即使第一个线程还没有给它赋值。因此返回的值是不正确的。
  >
  > > [!warning]
  > >
  > > 对于需要同步的是**单个**的变量或者内存位置，使用`std::atomic`就足够了。
  > >
  > > 一旦你需要对**两个以上**的变量或内存位置作为一个单元来操作的话，就应该使用互斥量
  >
  > 所以对于`Widget::magicValue`是这样的：
  >
  > ```cpp
  > class Widget {
  > public:
  >     …
  >     int magicValue() const
  >     {
  >         std::lock_guard<std::mutex> guard(m);   //锁定m
  >         
  >         if (cacheValid) return cachedValue;
  >         else {
  >             auto val1 = expensiveComputation1();
  >             auto val2 = expensiveComputation2();
  >             cachedValue = val1 + val2;
  >             cacheValid = true;
  >             return cachedValue;
  >         }
  >     }                                           //解锁m
  >     …
  > 
  > private:
  >     mutable std::mutex m;
  >     mutable int cachedValue;                    //不再用atomic
  >     mutable bool cacheValid{ false };           //不再用atomic
  > };
  > 
  > ```

- `const`成员函数应支持并发执行，这就是为什么你应该确保`const`成员函数是线程安全的。

---

### 总结

> [!note]
>
> - 确保`const`成员函数**线程安全**，除非你**确定**它们永远不会在并发上下文（*concurrent context*）中使用。
> - 使用`std::atomic`变量可能比互斥量提供更好的性能，但是它只适合操作**单个**变量或内存位置。

---



## **Item 17: Understand special member function generation**

### **特殊成员函数**

- **特殊成员函数**是指C++自己生成的函数

- C++98有四个：**默认构造函数，析构函数，拷贝构造函数，拷贝赋值运算符**

- 这些函数仅在需要的时候才生成，比如某个代码使用它们但是它们没有在类中明确声明

- **特殊成员函数的默认特性**：

  > - **隐式public且inline**：编译器生成的特殊成员函数默认是公开的（public）并且是内联的（inline），这意味着它们可以在类定义中直接定义，而不需要在类外单独定义。
  > - **非虚**：这些函数默认是非虚的（non-virtual），即它们不会参与多态。
  > - 特殊情况：**虚析构函数**，派生类继承了有虚析构函数的基类。在这种情况下，编译器为派生类生成的析构函数是虚的。

---

### 移动构造函数和移动赋值运算符

- C++11两个新的特殊成员函数：移动构造函数和移动赋值运算符

  > ```cpp
  > class Widget {
  > public:
  >     …
  >     Widget(Widget&& rhs);               //移动构造函数
  >     Widget& operator=(Widget&& rhs);    //移动赋值运算符
  >     …
  > };
  > ```
  >
  > 对**不可移动类型**（即对移动操作没有特殊支持的类型，比如大部分C++98传统类）使用“移动”操作实际上执行的是拷贝操作
  >
  > 逐成员移动的核心是对对象使用**`std::move`**
  >
  > 支持移动就会逐成员移动类成员和基类成员，如果不支持移动就执行拷贝操作

- 生成默认移动构造或者赋值函数的精确条件与拷贝操作的条件有点不同。

> 1. 两个拷贝操作是独立的：声明一个不会限制编译器生成另一个。
> 1. **两个移动操作不是相互独立**的。如果你声明了其中一个，编译器就不再生成另一个。
> 1. 如果一个类显式声明了拷贝操作，编译器就不会生成移动操作
> 1. 同样，声明移动操作（构造或赋值）使得编译器禁用拷贝操作。

---

### _Rule of Three_

- 如果你声明了拷贝构造函数，拷贝赋值运算符，或者析构函数三者之一，你应该也声明其余两个。

- 用户接管拷贝操作的需求几乎都是因为该类会做其他资源的管理

  > 1. 无论哪种资源管理如果在一个拷贝操作内完成，也应该在另一个拷贝操作内完成
  > 2. 类的析构函数也需要参与资源的管理（通常是释放）。通常要管理的资源是内存

- 只要出现用户定义的析构函数就意味着简单的逐成员拷贝操作不适用于该类。

  > 如果一个类声明了析构，拷贝操作可能不应该自动生成，因为它们做的事情可能是错误的

- *Rule of Three*规则背后的解释依然有效，再加上对声明拷贝操作阻止移动操作隐式生成的观察

  > C++11不会为那些有用户定义的析构函数的类生成移动操作。
  >
  > 所以仅当下面条件成立时才会生成移动操作（当需要时）：
  >
  > - 类中没有拷贝操作
  > - 类中没有移动操作
  > - 类中没有用户定义的析构

- 类似的规则也会扩展至拷贝操作上面

  > 如果你的某个声明了析构或者拷贝的类依赖自动生成的拷贝操作，你应该考虑升级这些类，消除依赖。
  >
  > 假设编译器生成的函数行为是正确的（即逐成员拷贝类non-static数据是你期望的行为），C++11的`= default`就可以：
  >
  > ```cpp
  > class Widget {
  >     public:
  >     … 
  >     ~Widget();                              //用户声明的析构函数
  >     …                                       //默认拷贝构造函数
  >     Widget(const Widget&) = default;        //的行为还可以
  > 
  >     Widget&                                 //默认拷贝赋值运算符
  >         operator=(const Widget&) = default; //的行为还可以
  >     … 
  > };
  > ```

- 除非类继承了一个已经是*virtual*的析构函数，否则要想析构函数为虚函数的唯一方法就是加上`virtual`关键字。

  > 用户声明的析构函数会抑制编译器生成移动操作，所以如果该类需要具有移动性，就**为移动操作加上`= default`**
  >
  > 声明移动会抑制拷贝生成，所以如果拷贝性也需要支持，再为拷贝操作加上`= default`：
  >
  > ```cpp
  > class Base {
  > public:
  >     virtual ~Base() = default;              //使析构函数virtual
  >     
  >     Base(Base&&) = default;                 //支持移动
  >     Base& operator=(Base&&) = default;
  >     
  >     Base(const Base&) = default;            //支持拷贝
  >     Base& operator=(const Base&) = default;
  >     … 
  > };
  > ```
  >
  > 应该手动声明它们然后加上`= default`，让你的意图更明确

---

### C++11对于特殊成员函数处理的规则

> [!tip]
>
> - **默认构造函数**：和C++98规则相同。仅当类不存在用户声明的构造函数时才自动生成。
> - **析构函数**：基本上和C++98相同；稍微不同的是现在**析构默认`noexcept`**（参见[Item14](https://cntransgroup.github.io/EffectiveModernCppChinese/3.MovingToModernCpp/item14.html)）。和C++98一样，仅当基类析构为虚函数时该类析构才为虚函数。
> - **拷贝构造函数**：和C++98运行时行为一样：逐成员拷贝non-static数据。仅当类没有用户定义的拷贝构造时才生成。如果类声明了移动操作它就是*delete*的。当用户声明了拷贝赋值或者析构，该函数自动生成已被废弃。
> - **拷贝赋值运算符**：和C++98运行时行为一样：逐成员拷贝赋值non-static数据。仅当类没有用户定义的拷贝赋值时才生成。如果类声明了移动操作它就是*delete*的。当用户声明了拷贝构造或者析构，该函数自动生成已被废弃。
> - **移动构造函数**和**移动赋值运算符**：都对非static数据执行逐成员移动。仅当类**没有用户定义的拷贝操作，移动操作或析构**时才自动生成。

- 注意没有“成员函数**模版**阻止编译器生成特殊成员函数”的规则

  > ```cpp
  > class Widget {
  >     …
  >     template<typename T>                //从任何东西构造Widget
  >     Widget(const T& rhs);
  > 
  >     template<typename T>                //从任何东西赋值给Widget
  >     Widget& operator=(const T& rhs);
  >     …
  > };
  > ```
  >
  > 编译器仍会生成移动和拷贝操作（假设正常生成它们的条件满足），即使可以模板实例化产出拷贝构造和拷贝赋值运算符的函数签名。

---



### 总结

> [!note]
>
> - 特殊成员函数是编译器**可能**自动生成的函数：默认构造函数，析构函数，拷贝操作，移动操作。
> - 移动操作仅当类没有显式声明移动操作，拷贝操作，析构函数时才自动生成。
> - 拷贝构造函数仅当类没有显式声明拷贝构造函数时才自动生成，并且**如果用户声明了移动操作，拷贝构造就是*delete***。拷贝赋值运算符仅当类没有显式声明拷贝赋值运算符时才自动生成，并且如果用户声明了移动操作，拷贝赋值运算符就是*delete*。当用户声明了**析构函数，拷贝操作的自动生成已被废弃**。
> - 成员函数**模板不抑制**特殊成员函数的生成。

---

