[TOC]

# [第4章 智能指针](https://cntransgroup.github.io/EffectiveModernCppChinese/4.SmartPointers/item18.html#第4章-智能指针)

- 原始指针的缺点

  > 1. 它的声明不能指示所指到底是单个对象还是数组。
  > 2. 它的声明没有告诉你用完后是否应该销毁它，即指针是否拥有所指之物。
  > 3. 如果你决定你应该销毁指针所指对象，没人告诉你该用`delete`还是其他析构机制（比如将指针传给专门的销毁函数）。
  > 4. 如果你发现该用`delete`。 原因1说了可能不知道该用单个对象形式（“`delete`”）还是数组形式（“`delete[]`”）。如果用错了结果是未定义的。
  > 5. 假设你确定了指针所指，知道销毁机制，也很难确定你在所有执行路径上都执行了**恰为一次**销毁操作（包括异常产生后的路径）。少一条路径就会产生资源泄漏，销毁多次还会导致未定义行为。
  > 6. 一般来说没有办法告诉你指针是否变成了悬空指针（dangling pointers），即内存中不再存在指针所指之物。在对象销毁后指针仍指向它们就会产生悬空指针。

- 智能指针

  > 智能指针包裹原始指针，它们的行为看起来像被包裹的原始指针，但避免了原始指针的很多陷阱
  >
  > 在C++11中存在四种智能指针
  >
  > 1. `std::auto_ptr`是来自C++98的已废弃遗留物，它是一次标准化的尝试，后来变成了C++11的`std::unique_ptr`。拷贝一个`std::auto_ptr`会将它本身设置为null！）和令人沮丧的使用限制（比如不能将`std::auto_ptr`放入容器）。
  > 2. `std::unique_ptr`在所有方面它都比`std::auto_ptr`好。
  > 3. 在`std::auto_ptr`唯一合法的使用场景就是代码使用C++98编译器编译。

---

## **Item 18: Use `std::unique_ptr` for exclusive-ownership resource management**

### `std::unique_ptr`

- 默认情况下，`std::unique_ptr`大小等同于原始指针，而且对于大多数操作（包括取消引用）

  > - 可以在**内存和时间都比较紧张**的情况下使用它。如果原始指针够小够快，那么`std::unique_ptr`一样可以。
  >
  > - `std::unique_ptr`体现了专有所有权（*exclusive ownership*）语义。
  >   - 具体来说，一个**non-null** `std::unique_ptr`始终拥有其指向的内容。
  >   - 移动一个`std::unique_ptr`将所有权从源指针转移到目的指针。（源指针被设为null。）
  >   - 拷贝一个`std::unique_ptr`是不允许的，

- `std::unique_ptr`是一种只可移动类型（*move-only type*）。当析构(**原始指针调用`delete`**)时，一个non-null `std::unique_ptr`销毁它指向的资源。

---

### `std::unique_ptr`的常见用法

1. `std::unique_ptr`的常见用法是作为继承层次结构中对象的工厂函数返回类型。

   > 假设我们有一个投资类型（比如股票、债券、房地产等）的**继承结构**，使用基类`Investment`。
   >
   > ![item18_fig1](D:\Internt_of_Thing\e_book\C++\note\Effective-Modern-C++\assets\item18_fig1.png)
   >
   > ```cpp
   > class Investment { … };
   > class Stock: public Investment { … };
   > class Bond: public Investment { … };
   > class RealEstate: public Investment { … };
   > ```
   >
   > 这种继承关系的工厂函数在堆上分配一个对象然后返回指针，调用方在不需要的时候有责任销毁对象。
   >
   > 1. 使用场景完美匹配`std::unique_ptr`，因为**调用者对工厂返回的资源负责**（即对该资源的专有所有权），并且`std::unique_ptr`在自己被销毁时会自动销毁指向的内容。
   >
   > ```cpp
   > //Investment继承关系的工厂函数
   > template<typename... Ts>            //返回指向对象的std::unique_ptr，
   > std::unique_ptr<Investment>         //对象使用给定实参创建
   > makeInvestment(Ts&&... params);
   > ```
   >
   > 2. 但是也可以在所有权转移的场景中使用它
   >
   >    1. 比如将工厂返回的`std::unique_ptr`**移入容器**中，然后将容器元素移入一个对象的数据成员中，然后对象过后被销毁。
   >    2. 发生这种情况时，这个对象的`std::unique_ptr`数据成员也被销毁，并且智能指针数据成员的析构将导致从工厂返回的资源被销毁。
   >    3. **默认情况下，销毁将通过`delete`进行**，但是在构造过程中，`std::unique_ptr`对象可以被设置为使用（对资源的）**自定义删除器**：当资源需要销毁时可调用的任意函数（或者函数对象，包括*lambda*表达式）
   >
   >    ```cpp
   >    auto delInvmt = [](Investment* pInvestment)         //自定义删除器
   >                    {                                   //（lambda表达式）
   >                        makeLogEntry(pInvestment);
   >                        delete pInvestment; 
   >                    };
   >       
   >    template<typename... Ts>
   >    std::unique_ptr<Investment, decltype(delInvmt)>     //更改后的返回类型
   >    makeInvestment(Ts&&... params)
   >    {
   >        std::unique_ptr<Investment, decltype(delInvmt)> //应返回的指针
   >            //makeInvestment的基本策略是创建一个空的std::unique_ptr，然后指向一个合适类型的对象，然后返回。
   >            pInv(nullptr, delInvmt);
   >           
   >        //过reset来让pInv接管通过new创建的对象的所有权
   >        if (/*一个Stock对象应被创建*/)
   >        {
   >            pInv.reset(new Stock(std::forward<Ts>(params)...));
   >        }
   >        else if ( /*一个Bond对象应被创建*/ )   
   >        {     
   >            pInv.reset(new Bond(std::forward<Ts>(params)...));   
   >        }   
   >        else if ( /*一个RealEstate对象应被创建*/ )   
   >        {     
   >            pInv.reset(new RealEstate(std::forward<Ts>(params)...));   
   >        }   
   >        return pInv;
   >    }
   >       
   >    ```
   >
   >    - 们通过基类指针删除派生类实例，为此，基类`Investment`必须有虚析构函数：
   >
   >      ```cpp
   >      class Investment {
   >      public:
   >          …
   >          virtual ~Investment();          //关键设计部分！
   >          …
   >      };
   >      ```
   >
   >    - 在C++14中，函数返回类型推导的存在（参阅[Item3](https://cntransgroup.github.io/EffectiveModernCppChinese/1.DeducingTypes/item3.html)），意味着`makeInvestment`可以以更简单，更封装的方式实现：
   >
   >      ```cpp
   >      template<typename... Ts>
   >      auto makeInvestment(Ts&&... params)                 //C++14
   >      {
   >          auto delInvmt = [](Investment* pInvestment)     //现在在
   >                          {                               //makeInvestment里
   >                              makeLogEntry(pInvestment);
   >                              delete pInvestment; 
   >                          };
   >           
   >          std::unique_ptr<Investment, decltype(delInvmt)> //同之前一样
   >              pInv(nullptr, delInvmt);
   >          if ( … )                                        //同之前一样
   >          {
   >              pInv.reset(new Stock(std::forward<Ts>(params)...));
   >          }
   >          else if ( … )                                   //同之前一样
   >          {     
   >              pInv.reset(new Bond(std::forward<Ts>(params)...));   
   >          }   
   >          else if ( … )                                   //同之前一样
   >          {     
   >              pInv.reset(new RealEstate(std::forward<Ts>(params)...));   
   >          }   
   >          return pInv;                                    //同之前一样
   >      }
   >           
   >      ```

- 对于函数对象形式的删除器来说，变化的大小取决于**函数对象中存储的状态多少**，无状态函数（stateless function）对象（比如不捕获变量的*lambda*表达式）对大小没有影响

  > 这意味当自定义删除器可以实现为函数或者*lambda*时，尽量使用*lambda*：
  >
  > ```cpp
  > auto delInvmt1 = [](Investment* pInvestment)        //无状态lambda的
  >                  {                                  //自定义删除器
  >                      makeLogEntry(pInvestment);
  >                      delete pInvestment; 
  >                  };
  > 
  > template<typename... Ts>                            //返回类型大小是
  > std::unique_ptr<Investment, decltype(delInvmt1)>    //Investment*的大小
  > makeInvestment(Ts&&... args);
  > 
  > void delInvmt2(Investment* pInvestment)             //函数形式的
  > {                                                   //自定义删除器
  >     makeLogEntry(pInvestment);
  >     delete pInvestment;
  > }
  > template<typename... Ts>                            //返回类型大小是
  > std::unique_ptr<Investment, void (*)(Investment*)>  //Investment*的指针
  > makeInvestment(Ts&&... params);                     //加至少一个函数指针的大小
  > 
  > ```

- 工厂函数不是`std::unique_ptr`的唯一常见用法。作为实现**Pimpl Idiom**（译注：*pointer to implementation*，一种隐藏实际实现而减弱编译依赖性的设计思想

### `std::unique_ptr`形式

1. 用于单个对象（`std::unique_ptr<T>`），
2. 用于数组（`std::unique_ptr<T[]>`）

> [!tip]
>
> - `std::unique_ptr`的API设计会自动匹配你的用法，
> - 比如`operator[]`就是数组对象，解引用操作符（`operator*`和`operator->`）就是单个对象专有。

- `std::unique_ptr`是C++11中表示专有所有权的方法，但是其最吸引人的功能之一是它可以轻松高效的转换为`std::shared_ptr`：

  ```cpp
  std::shared_ptr<Investment> sp =            //将std::unique_ptr
      makeInvestment(arguments);              //转为std::shared_ptr
  ```

   通过返回`std::unique_ptr`，工厂为调用者提供了**最有效的智能指针**，但它们并不妨碍调用者用其更灵活的兄弟替换它。

---

### 总结

> [!note]
>
> - `std::unique_ptr`是**轻量级、快速的、只可移动**（*move-only*）的管理**专有所有权**语义资源的智能指针
> - 默认情况，资源销毁通过`delete`实现，但是**支持自定义删除器**。有状态的删除器和函数指针会增加`std::unique_ptr`对象的大小
> - 将`std::unique_ptr`**转化**为`std::shared_ptr`非常简单

---



## **Item 19: Use `std::shared_ptr` for shared-ownership resource management**

### `std::shared_ptr`

- 一个自动工作的世界（像是垃圾回收），一个销毁可预测的世界（像是析构)

- C++11中的`std::shared_ptr`将两者组合了起来。

  > 一个通过`std::shared_ptr`访问的对象其生命周期由指向它的有**共享所有权（*shared ownership*）的指针们**来管理
  >
  > 没有特定的`std::shared_ptr`拥有该对象。
  >
  > 当**最后一个**指向某对象的`std::shared_ptr`不再指向那（比如因为`std::shared_ptr`被销毁或者指向另一个不同的对象），`std::shared_ptr`会销毁它所指向的对象。

- 就垃圾回收来说，客户端不需要关心指向对象的生命周期，而对象的析构是确定性的（没有`std::unique_ptr`指向该对象）

### `std::shared_ptr`的引用计数

- `std::shared_ptr`通过引用计数（*reference count*）来确保它是否是最后一个指向某种资源的指针，**引用计数关联资源并跟踪**有多少`std::shared_ptr`指向该资源。

- `std::shared_ptr`**构造函数递增**引用计数值（注意是**通常**——原因参见下面），**析构函数递减**值，拷贝赋值运算符做前面这两个工作。

  > 具体来说，`sp1`和`sp2`是`std::shared_ptr`并且指向不同对象
  >
  > - 赋值“`sp1 = sp2;`”会使`sp1`指向`sp2`指向的对象。直接效果就是`sp1`引用计数减一，`sp2`引用计数加一
  > - 如果`std::shared_ptr`在计数值递减后发现引用计数值为零，没有其他`std::shared_ptr`指向该资源，它就会销毁资源。

---

### 引用计数性能问题

1. **`std::shared_ptr`大小是原始指针的两倍**，因为它内部包含一个**指向资源**的原始指针，还包含一个指向资源的**引用计数值**的原始指针。
2. **引用计数的内存必须动态分配**。被指向的对象不知道有一个关联到自己的计数值，所以任何对象——甚至是内置类型的——都可以由`std::shared_ptr`管理
3. **递增递减引用计数必须是原子性的**，多个reader、writer可能在不同的线程，即指向某种资源的`std::shared_ptr`可能在一个线程执行析构（于是递减指向的对象的引用计数），在另一个不同的线程执行的却是拷贝操作（因此递增了同一个引用计数）。而原子操作比非原子操作慢

为什么`std::shared_ptr`构造函数只是“通常”递增指向对象的引用计数？

> 原因是**移动构造函数**的存在。
>
> 从另一个`std::shared_ptr`移动构造新`std::shared_ptr`会将原来的`std::shared_ptr`设置为null，那意味着老的`std::shared_ptr`不再指向资源，同时新的`std::shared_ptr`指向资源。结果就是不需要修改引用计数值
>
> 因此移动`std::shared_ptr`会比拷贝它要快

---

### `std::shared_ptr`销毁机制

- `std::shared_ptr`使用`delete`作为资源的默认销毁机制，但是它也支持自定义的删除器。

- 对于`std::unique_ptr`来说，删除器类型是智能指针类型的一部分。对于`std::shared_ptr`则删除器类型不是智能指针类型的一部分

  > 
  >
  > ```cpp
  > auto loggingDel = [](Widget *pw)        //自定义删除器
  >                   {                     //（和条款18一样）
  >                       makeLogEntry(pw);
  >                       delete pw;
  >                   };
  > 
  > std::unique_ptr<                        //删除器类型是
  >     Widget, decltype(loggingDel)        //指针类型的一部分
  >     > upw(new Widget, loggingDel);
  > std::shared_ptr<Widget>                 //删除器类型不是
  >     spw(new Widget, loggingDel);        //指针类型的一部分
  > ```
  >
  > 考虑有两个`std::shared_ptr<Widget>`，每个自带不同的删除器（比如通过*lambda*表达式自定义删除器）
  >
  > ```cpp
  > auto customDeleter1 = [](Widget *pw) { … };     //自定义删除器，
  > auto customDeleter2 = [](Widget *pw) { … };     //每种类型不同
  > std::shared_ptr<Widget> pw1(new Widget, customDeleter1);
  > std::shared_ptr<Widget> pw2(new Widget, customDeleter2);
  > 
  > //pw1和pw2有相同的类型，所以它们都可以放到存放那个类型的对象的容器中
  > std::vector<std::shared_ptr<Widget>> vpw{ pw1, pw2 };
  > ```
  >
  > - 同样，它们也能相互赋值，也可以传入一个形参为`std::shared_ptr<Widget>`的函数。
  > - 但是**自定义删除器类型不同的`std::unique_ptr`就不行**，因为`std::unique_ptr`把删除器视作类型的一部分。

- 另一个不同于`std::unique_ptr`的地方是，指定自定义删除器不会改变`std::shared_ptr`**对象的大小**。

  > 不管删除器是什么，一个`std::shared_ptr`对象都是**两个指针大小**。
  >
  > 每个`std::shared_ptr`管理的对象都有个相应的控制块。
  >
  > 控制块除了包含**引用计数值**外还有一个**自定义删除器的拷贝**，当然前提是存在自定义删除器。
  >
  > ![item19_fig1](D:\Internt_of_Thing\e_book\C++\note\Effective-Modern-C++\assets\item19_fig1.png)
  >
  > 对于一个创建指向对象的`std::shared_ptr`的函数来说不可能知道是否有其他`std::shared_ptr`早已指向那个对象，所以控制块的创建会遵循下面几条规则：
  >
  > > 1. **`std::make_shared`（参见[Item21](https://cntransgroup.github.io/EffectiveModernCppChinese/4.SmartPointers/item21.html)）总是创建一个控制块**。因为`std::make_shared`调用时创建一个要指向的新对象。
  > > 2. **当从独占指针（即`std::unique_ptr`或者`std::auto_ptr`）上构造出`std::shared_ptr`时会创建控制块**。因为独占指针没有使用控制块，所以指针指向的对象没有关联控制块。
  > > 3. **当从原始指针上构造出`std::shared_ptr`时会创建控制块**。相反，用`std::shared_ptr`或者`std::weak_ptr`作为构造函数实参创建`std::shared_ptr`不会创建新控制块，因为它可以依赖传递来的智能指针指向控制块。

- 这些规则造成的后果就是从原始指针上构造超过一个`std::shared_ptr`就会让你走上未定义行为的快车道

  > 因为指向的对象有多个控制块关联。多个控制块意味着多个引用计数值，多个引用计数值意味着对象将会被销毁多次（每个引用计数一次）
  >
  > ```cpp
  > auto pw = new Widget;                           //pw是原始指针
  > …
  > std::shared_ptr<Widget> spw1(pw, loggingDel);   //为*pw创建控制块
  > …
  > std::shared_ptr<Widget> spw2(pw, loggingDel);   //为*pw创建第二个控制块
  > ```
  >
  > 因此`*pw`有两个引用计数值，每一个最后都会变成零，然后最终导致`*pw`销毁两次。第二个销毁会产生未定义行为。

  > [!warning]
  >
  > 第一，避免传给`std::shared_ptr`构造函数原始指针。通常替代方案是使用`std::make_shared`（参见[Item21](https://cntransgroup.github.io/EffectiveModernCppChinese/4.SmartPointers/item21.html)）
  >
  > 第二，如果你必须传给`std::shared_ptr`构造函数原始指针，直接传`new`出来的结果，不要传指针变量。
  >
  > ```cpp
  > std::shared_ptr<Widget> spw1(new Widget,    //直接使用new的结果
  >                              loggingDel);
  > ```

---

### std::enable_shared_from_this

- 错误的部分是传递`this`，而不是使用了`emplace_back`。

  > ```cpp
  > void Widget::process()
  > {
  >     …                                       //处理Widget
  >     processedWidgets.emplace_back(this);    //然后将它加到已处理过的Widget
  > }                                           //的列表中，这是错的！
  > 
  > ```
  >
  > `std::shared_ptr`会由此为指向的`Widget`（`*this`）创建一个控制块
  >
  > 如果成员函数外面早已存在指向那个`Widget`对象的指针，它是未定义行为

- 如果你想创建一个用`std::shared_ptr`管理的类，这个类能够用`this`指针安全地创建一个`std::shared_ptr`，`std::enable_shared_from_this`就可作为基类的模板类。

  > ```cpp
  > class Widget: public std::enable_shared_from_this<Widget> {
  > public:
  >     …
  >     void process();
  >     …
  > };
  > ```
  >
  > - `std::enable_shared_from_this`定义了一个成员函数，成员函数会创建指向当前对象的`std::shared_ptr`却**不创建多余控制块**。
  >
  > ```cpp
  > void Widget::process()
  > {
  >     //和之前一样，处理Widget
  >     …
  >     //把指向当前对象的std::shared_ptr加入processedWidgets
  >     processedWidgets.emplace_back(shared_from_this());
  > }
  > ```
  >
  > 从内部来说，`shared_from_this`**查找**当前对象控制块，然后创建一个新的`std::shared_ptr`关联这个控制块。
  >
  > 但是没有`std::shared_ptr`指向当前对象（即当前对象没有关联控制块），行为是未定义的，`shared_from_this`通常抛出一个异常。

- 防止客户端在存在一个指向对象的`std::shared_ptr`前先**调用含有`shared_from_this`的成员函数**，**继承自`std::enable_shared_from_this`**的类通常将它们的**构造函数声明为`private`**，并且让客户端通过**返回`std::shared_ptr`的工厂函数创建对象**。

  ```cpp
  class Widget: public std::enable_shared_from_this<Widget> {
  public:
      //完美转发参数给private构造函数的工厂函数
      template<typename... Ts>
      static std::shared_ptr<Widget> create(Ts&&... params);
      …
      void process();     //和前面一样
      …
  private:
      …                   //构造函数
  };
  ```

---

### `std::shared_ptr`开销

- 在通常情况下，使用默认删除器和默认分配器，使用`std::make_shared`创建`std::shared_ptr`，产生的控制块只需三个word大小。
- 对`std::shared_ptr`解引用的开销不会比原始指针高。
- 对于每个被`std::shared_ptr`指向的对象来说，控制块中的虚函数机制产生的开销通常只需要承受一次，即对象销毁的时候。

> [!tip]
>
> 想想你是否需要共享所有权。如果独占资源可行或者**可能**可行，用`std::unique_ptr`是一个更好的选择。
>
> `std::unique_ptr`的性能表现更接近于原始指针，并且从`std::unique_ptr`升级到`std::shared_ptr`也很容易，
>
> 反之不行。当你的资源由`std::shared_ptr`管理，现在又想修改资源生命周期管理方式是没有办法的。

- `std::shared_ptr`不能处理的另一个东西是数组。

  > 自 C++17 起 std::shared_ptr 可以用于管理动态分配的数组，使用 `std::shared_ptr<T[]>`

---

### 总结

> [!note]
>
> - `std::shared_ptr`为有**共享所有权**的任意资源提供一种自动垃圾回收的便捷方式。
> - 较之于`std::unique_ptr`，`std::shared_ptr`对象通常大两倍，控制块会产生开销，需要原子性的引用计数修改操作。
> - 默认资源销毁是通过`delete`，但是也支持自定义删除器。删除器的类型是什么对于`std::shared_ptr`的类型没有影响。
> - **避免从原始指针变量上创建**`std::shared_ptr`。

---



## **Item 20: Use `std::weak_ptr` for `std::shared_ptr`-like pointers that can dangle**

### `std::weak_ptr`

- `std::weak_ptr`最精确的描述：`std::shared_ptr`的增强

  > 像`std::shared_ptr`（见[Item19](https://cntransgroup.github.io/EffectiveModernCppChinese/4.SmartPointers/item19.html)）的但是不参与资源所有权共享的指针
  >
  > 类似`std::shared_ptr`但不影响对象引用计数的指针
  >
  > 在**悬空时知晓**，悬空（*dangle*）就是指针指向的对象不再存在。

- `std::weak_ptr`不能解引用，也不能测试是否为空值。

  > `std::weak_ptr`通常从`std::shared_ptr`上创建。
  >
  > `std::weak_ptr`不会影响所指对象的引用计数
  >
  > ```cpp
  > auto spw =                      //spw创建之后，指向的Widget的
  >     std::make_shared<Widget>(); //引用计数（ref count，RC）为1。
  >                                 //std::make_shared的信息参见条款21
  > …
  > std::weak_ptr<Widget> wpw(spw); //wpw指向与spw所指相同的Widget。RC仍为1
  > …
  > spw = nullptr;                  //RC变为0，Widget被销毁。
  >                                 //wpw现在悬空
  > 
  > ```
  >
  > 其中，悬空的`std::weak_ptr`被称作已经**expired**（过期）
  >
  > `if (wpw.expired()) …            //如果wpw没有指向对象…`

---

### `std::weak_ptr`过期问题

> [!warning]
>
> 通常你期望的是检查`std::weak_ptr`是否已经过期，如果没有过期则访问其指向的对象
>
> 将**检查和解引用分开会引入竞态条件**：在调用`expired`和解引用操作之间，另一个线程可能对指向这对象的`std::shared_ptr`重新赋值或者析构，并由此造成对象已析构。
>
> 解引用将会产生未定义行为

- 一个原子操作检查`std::weak_ptr`是否已经过期，如果没有过期就访问所指对象

  > [!tip]
  >
  > 通过从`std::weak_ptr`创建`std::shared_ptr`来实现，
  >
  > 具体用哪种取决于`std::weak_ptr`过期时你希望**`std::shared_ptr`表现**出什么行为：
  >
  > 1. 一种形式是**`std::weak_ptr::lock`**，它返回一个`std::shared_ptr`，如果`std::weak_ptr`过期这个**`std::shared_ptr`为空**：
  >
  >    ```cpp
  >    std::shared_ptr<Widget> spw1 = wpw.lock();  //如果wpw过期，spw1就为空
  >     											
  >    auto spw2 = wpw.lock();                     //同上，但是使用auto
  >    ```
  >
  > 2. 另一种形式是以`std::weak_ptr`为实参构造`std::shared_ptr`。如果`std::weak_ptr`过期，会抛出一个异常：
  >
  >    ```cpp
  >    std::shared_ptr<Widget> spw3(wpw);          //如果wpw过期，抛出std::bad_weak_ptr异常
  >    ```

---

### `std::weak_ptr`用例

- 考虑一个工厂函数，它基于一个唯一ID从只读对象上产出智能指针。根据[Item18](https://cntransgroup.github.io/EffectiveModernCppChinese/4.SmartPointers/item19.html)的描述，工厂函数会返回一个该对象类型的`std::unique_ptr`：

> ```cpp
> std::unique_ptr<const Widget> loadWidget(WidgetID id);
> ```
>
> 并且调用`loadWidget`是一个昂贵的操作（比如它操作文件或者数据库I/O）并且重复使用ID很常见
>
> - 合理的优化是再写一个函数除了完成`loadWidget`做的事情之外再缓存它的结果
> - 另一个合理的优化可以是当`Widget`不再使用的时候销毁它的缓存。

- 对于可缓存的工厂函数，返回`std::unique_ptr`不是好的选择。

> 缓存对象的指针需要知道它是否已经悬空，因为当工厂客户端使用完工厂产生的对象后，对象将被销毁，关联的缓存条目会悬空。
>
> 所以缓存应该使用`std::weak_ptr`，这可以知道是否已经悬空。
>
> ```cpp
> //当对象的生命周期由std::shared_ptr管理时，std::weak_ptr才能检测到悬空。
> std::shared_ptr<const Widget> fastLoadWidget(WidgetID id)
> {
>     static std::unordered_map<WidgetID,
>                               std::weak_ptr<const Widget>> cache;
>                                         //译者注：这里std::weak_ptr<const Widget>是高亮
>     auto objPtr = cache[id].lock();     //objPtr是去缓存对象的
>                                         //std::shared_ptr（或
>                                         //当对象不在缓存中时为null）
> 
>     if (!objPtr) {                      //如果不在缓存中
>         objPtr = loadWidget(id);        //加载它
>         cache[id] = objPtr;             //缓存它
>     }
>     return objPtr;
> }
> 
> ```
>
> `fastLoadWidget`的实现忽略了以下事实：**缓存可能会累积过期的`std::weak_ptr`**，这些指针对应了不再使用的`Widget`（也已经被销毁了）

- 让我们考虑第二个用例：观察者设计模式（Observer design pattern）

  > 此模式的主要组件是**subjects（状态可能会更改的对象）**和**observers（状态发生更改时要通知的对象）**
  >
  > 在大多数实现中，每个subject都包含一个数据成员，该成员持有**指向其observers的指针**。这使subjects很容易发布状态更改通知。
  >
  > 一个合理的设计是每个subject持有一个`std::weak_ptr`s容器指向observers，因此可以在**使用前检查**是否已经悬空。

- 最后一个使用`std::weak_ptr`的例子

  > `A`和`C`共享`B`的所有权，因此持有`std::shared_ptr`：
  >
  > 假定从B指向A的指针也很有用。应该使用哪种指针？
  >
  > ![item20_fig2](D:\Internt_of_Thing\e_book\C++\note\Effective-Modern-C++\assets\item20_fig2.png)
  >
  > 有三种选择：
  >
  > 1. **原始指针**。如果`A`被销毁，但是`C`继续指向`B`，`B`就会有一个指向`A`的悬空指针。
  > 2. **`std::shared_ptr`**。`A`和`B`都互相持有对方的`std::shared_ptr`，导致的`std::shared_ptr`环状结构（`A`指向`B`，`B`指向`A`）**阻止`A`和`B`的销毁**。当没有指针（C`不再指向`B）指向A和B的环形结构，每个的引用计数都还是1，无法降为0，**`A`和`B`都被泄漏**：程序无法访问它们，但是资源并没有被回收。
  > 3. **`std::weak_ptr`**。则避免了上述两个问题。并且破坏了A和B的环形结构。
  >
  > > [!tip]
  > >
  > > 需要注意使用`std::weak_ptr`打破`std::shared_ptr`循环并不常见
  > >
  > > 在严格分层的数据结构比如树中，子节点只被父节点持有。当父节点被销毁时，子节点就被销毁。
  > >
  > > 因此没有子节点解引用一个悬垂的父节点指针这样的风险。

- 效率角度来看，`std::weak_ptr`与`std::shared_ptr`基本相同。

  > 大小是相同的，使用相同的控制块（参见[Item19](https://cntransgroup.github.io/EffectiveModernCppChinese/4.SmartPointers/item19.html)），构造、析构、赋值操作涉及引用计数的原子操作。
  >
  > > [!warning]
  > >
  > > `std::weak_ptr`不参与对象的**共享所有权**，因此不影响**指向对象的引用计数**。实际上在控制块中还是有第二个引用计数，`std::weak_ptr`操作的是第二个引用计数。

----

### 总结

> [!note]
>
> - 用`std::weak_ptr`**替代可能会悬空的`std::shared_ptr`**。
> - `std::weak_ptr`的潜在使用场景包括：**缓存、观察者列表、打破`std::shared_ptr`环状结构**。

---



## **Item 21: Prefer `std::make_unique` and `std::make_shared` to direct use of `new`**

### `std::make_unique ans std::make_shared`

- `std::make_unique`从C++14开始加入标准库。

  > 使用C++11，自己写一个基础版本的`std::make_unique`如下：
  >
  > ```cpp
  > template<typename T, typename... Ts>
  > std::unique_ptr<T> make_unique(Ts&&... params)
  > {
  >     return std::unique_ptr<T>(new T(std::forward<Ts>(params)...));
  > }
  > ```
  >
  > `make_unique`只是将它的参数完美转发到所要创建的对象的构造函数
  >
  > 这种形式的函数不支持数组和自定义析构（见[Item18](https://cntransgroup.github.io/EffectiveModernCppChinese/4.SmartPointers/item18.html)）

- 三个**make函数**

  > - `std::make_unique`和`std::make_shared`：接收**任意的多参数集合**，**完美转发**到构造函数去动态分配一个对象，然后返回这个指向这个对象的指针。
  > - `std::allocate_shared`。它行为和`std::make_shared`一样，只不过第一个参数是用来**动态分配内存的*allocator*对象**。

- 用和不用`make`函数来创建智能指针的一个小小比较

  > ```cpp
  > auto upw1(std::make_unique<Widget>());      //使用make函数
  > std::unique_ptr<Widget> upw2(new Widget);   //不使用make函数
  > auto spw1(std::make_shared<Widget>());      //使用make函数
  > std::shared_ptr<Widget> spw2(new Widget);   //不使用make函数
  > ```
  >
  > 1. 用`new`的声明语句需要写2遍`Widget`，`make`函数只需要写一次，**源代码中的重复增加了编译的时间**，会导致目标代码冗余，并且通常会让代码库使用更加困难。

- 第二个使用`make`函数的原因和异常安全有关

  > 有个函数按照某种优先级处理`Widget`
  >
  > ```cpp
  > void processWidget(std::shared_ptr<Widget> spw, int priority);
  > 
  > //计算相关的优先级
  > int computePriority();
  > 
  > processWidget(std::shared_ptr<Widget>(new Widget),  //潜在的资源泄漏！
  >               computePriority());
  > ```
  >
  > 代码可能在`new`一个`Widget`时发生泄漏。为何？
  >
  > >[!tip]
  > >
  > >答案和编译器将源码转换为目标代码有关。
  > >
  > >一个函数的实参必须先被计算，这个函数再被调用
  > >
  > >调用`processWidget`之前:
  > >
  > >1. 表达式“`new Widget`”必须计算，例如，一个`Widget`对象必须在堆上被创建
  > >2. 负责管理`new`出来指针的`std::shared_ptr<Widget>`构造函数必须被执行
  > >3. `computePriority`必须运行
  > >
  > >编译器不需要按照执行顺序生成代码。
  >
  > `std::make_shared`可以防止这种问题
  >
  > ```cpp
  > processWidget(std::make_shared<Widget>(),   //没有潜在的资源泄漏
  >               computePriority());
  > ```

- `std::make_shared`的一个特性（与直接使用`new`相比）是**效率提升**。

  > 使用`std::make_shared`允许编译器生成更小，更快的代码，并使用更简洁的数据结构。
  >
  > 对new的直接使用:`std::shared_ptr<Widget> spw(new Widget);`进行内存分配两次
  >
  > `new`需要为`Widget`进行一次内存分配
  >
  > 控制块的内存在`std::shared_ptr`构造函数中分配
  >
  > - `std::make_shared`分配一块内存，**同时容纳**了`Widget`对象和控制块。
  > - 使用`std::make_shared`避免了对控制块中的某些簿记信息的需要，潜在地减少了程序的总内存占用。
  >
  > 效率分析同样适用于`std::allocate_shared`

### `make`函数缺点

- `make`函数都不允许指定自定义删除器，但是`std::unique_ptr`和`std::shared_ptr`的构造函数可以接收一个删除器参数

  > ```cpp
  > auto widgetDeleter = [](Widget* pw) { … };
  > 
  > //只能直接使用new
  > std::unique_ptr<Widget, decltype(widgetDeleter)>
  >     upw(new Widget, widgetDeleter);
  > 
  > std::shared_ptr<Widget> spw(new Widget, widgetDeleter);
  > ```

- `make`函数第二个限制来自于其实现中的语法细节。

  > `make`函数会将它们的参数完美转发给对象构造函数使用小括号
  >
  > 花括号初始化无法完美转发。但是，[Item30](https://cntransgroup.github.io/EffectiveModernCppChinese/5.RRefMovSemPerfForw/item30.html)介绍了一个变通的方法：使用`auto`类型推导从花括号初始化创建`std::initializer_list`对象
  >
  > ```cpp
  > //创建std::initializer_list
  > auto initList = { 10, 20 };
  > //使用std::initializer_list为形参的构造函数创建std::vector
  > auto spv = std::make_shared<std::vector<int>>(initList);
  > ```

- 对于`std::unique_ptr`，只有这两种情景（**自定义删除器和花括号初始化**）使用`make`函数有点问题。



### 边缘情况

1. 使用`make`函数去创建重载了`operator new`和`operator delete`类的对象

   > `std::allocate_shared`需要的内存总大小不等于动态分配的对象大小，还需要**再加上**控制块大小
   >
   > 而一些类重载了`operator new`和`operator delete`。这些函数的存在意味着对这些类型的对象的全局内存分配和释放是不合常规的。设计这种定制操作往往只会**精确的分配、释放对象大小的内存**。

2. 如果对象类型非常大，而且销毁最后一个`std::shared_ptr`和销毁最后一个`std::weak_ptr`之间的时间很长，那么在销毁对象和释放它所占用的内存之间可能会出现延迟。

   > 只要`std::weak_ptr`s引用一个控制块（即*weak count*大于零），该控制块必须继续存在。只要控制块存在，包含它的内存就必须保持分配。

3. 确保在直接使用`new`时，在**一个不做其他事情的语句中**，立即将结果传递到智能指针构造函数。

---

### 总结

> [!note]
>
> - 和直接使用`new`相比，`make`函数消除了代码重复，提高了异常安全性。对于`std::make_shared`和`std::allocate_shared`，生成的代码更小更快。
> - 不适合使用`make`函数的情况包括需要指定自定义删除器和希望用花括号初始化。
> - 对于`std::shared_ptr`s，其他不建议使用`make`函数的情况包括(1)有自定义内存管理的类；(2)特别关注内存的系统，非常大的对象，以及`std::weak_ptr`s比对应的`std::shared_ptr`s活得更久。

---



## **Item 22: When using the Pimpl Idiom, define special member functions in the implementation file**

### **Pimpl**（*pointer to implementation*）**惯用法**

- **Pimpl**（*pointer to implementation*）**惯用法**是一种技巧

  > 将类数据成员替换成一个**指向包含具体实现的类**（或结构体）的指针
  >
  > 并将放在主类（primary class）的数据成员们移动到**实现类**（implementation class）去
  >
  > 这些数据成员的访问将通过指针间接访问
  >
  > ```cpp
  > class Widget() {                    //定义在头文件“widget.h”
  > public:
  >     Widget();
  >     …
  > private:
  >     std::string name;
  >     std::vector<double> data;
  >     Gadget g1, g2, g3;              //Gadget是用户自定义的类型
  > };
  > ```
  >
  > `gadget.h`可能会经常修订

- 在C++98中使用Pimpl惯用法，可以把`Widget`的数据成员**替换成一个原始指针**，指向一个已经被声明过却还未被定义的结构体

  > ```cpp
  > class Widget                        //仍然在“widget.h”中
  > {
  > public:
  >     Widget();
  >     ~Widget();                      //析构函数在后面会分析
  >     …
  > 
  > private:
  >     struct Impl;                    //声明一个 实现结构体
  >     Impl *pImpl;                    //以及指向它的指针
  > };
  > ```
  >
  > `Widget`的使用者不再需要为了这些类型而引入头文件
  >
  > 可以加速编译，并且如果这些头文件中有所变动，`Widget`的使用者不会受到影响
  >
  > (感觉类似于接口类)
  >
  > 一个已经被声明，却还未被实现的类型，被称为**不完整类型**（*incomplete type*）,`Widget::Impl`就是这种类型。 

- Pimpl惯用法

  > 1. 第一步，是**声明一个数据成员，它是个指针**，指向一个不完整类型。
  > 2. 第二步是**动态分配和回收一个对象**，该对象包含那些以前在原来的类中的数据成员
  >
  > ```cpp
  > #include "widget.h"             //以下代码均在实现文件“widget.cpp”里
  > #include "gadget.h"
  > #include <string>
  > #include <vector>
  > 
  > struct Widget::Impl {           //含有之前在Widget中的数据成员的
  >     std::string name;           //Widget::Impl类型的定义
  >     std::vector<double> data;
  >     Gadget g1,g2,g3;
  > };
  > 
  > Widget::Widget()                //为此Widget对象分配数据成员
  > : pImpl(new Impl)
  > {}
  > 
  > Widget::~Widget()               //销毁数据成员
  > { delete pImpl; }
  > 
  > ```

- `std::unique_ptr`（见[Item18](https://cntransgroup.github.io/EffectiveModernCppChinese/4.SmartPointers/item18.html)）是最合适的工具。在头文件中用`std::unique_ptr`替代原始指针

  > ```cpp
  > class Widget {                      //在“widget.h”中
  > public:
  >     Widget();
  >     …
  > 
  > private:
  >     struct Impl;
  >     std::unique_ptr<Impl> pImpl;    //使用智能指针而不是原始指针
  > };
  > 
  > //实现文件
  > #include "widget.h"                 //在“widget.cpp”中
  > #include "gadget.h"
  > #include <string>
  > #include <vector>
  > 
  > struct Widget::Impl {               //跟之前一样
  >     std::string name;
  >     std::vector<double> data;
  >     Gadget g1,g2,g3;
  > };
  > 
  > Widget::Widget()                    //根据条款21，通过std::make_unique
  > : pImpl(std::make_unique<Impl>())   //来创建std::unique_ptr
  > {}
  > ```
  >
  > 但是，最普通的`Widget`用法却会导致编译出错：
  >
  > ```cpp
  > #include "widget.h"
  > 
  > Widget w;                           //错误！
  > ```
  >
  > 在使用`delete`之前，通常会使默认删除器使用C++11的特性**`static_assert`**来确保原始指针指向的类型不是一个不完整类型。
  >
  > 当编译器为`Widget w`的析构生成代码时，它会遇到`static_assert`检查并且失败，这通常是错误信息的来源(只在对象`w`销毁的地方出现)。

- 为了解决这个问题，你只需要确保在编译器生成销毁`std::unique_ptr<Widget::Impl>`的代码之前， `Widget::Impl`已经是一个**完整类型**（*complete type*）

  > ```cpp
  > //widget.h
  > class Widget {                  //跟之前一样，在“widget.h”中
  > public:
  >     Widget();
  >     ~Widget(); //只声明类Widget的析构函数，但不要在这里定义它
  >     …
  > 
  > private:                        //跟之前一样
  >     struct Impl;
  >     std::unique_ptr<Impl> pImpl;
  > };
  > 
  > //widget.cpp
  > #include "widget.h"                 //跟之前一样，在“widget.cpp”中
  > #include "gadget.h"
  > #include <string>
  > #include <vector>
  > 
  > struct Widget::Impl {               //跟之前一样，定义Widget::Impl
  >     std::string name;
  >     std::vector<double> data;
  >     Gadget g1,g2,g3;
  > }
  > 
  > Widget::Widget()                    //跟之前一样
  > : pImpl(std::make_unique<Impl>())
  > {}
  > //在结构体Widget::Impl被定义之后，再定义析构函数
  > Widget::~Widget()                   
  > {}
  > ```

- Pimpl惯用法的类自然适合支持移动操作，声明一个类`Widget`的析构函数会阻止编译器生成移动操作

  > 自己声明相关函数，把移动操作的定义移动到实现文件里
  >
  > ```cpp
  > class Widget {                          //仍然在“widget.h”中
  > public:
  >     Widget();
  >     ~Widget();
  > 
  >     Widget(Widget&& rhs);               //只有声明
  >     Widget& operator=(Widget&& rhs);
  >     …
  > 
  > private:                                //跟之前一样
  >     struct Impl;
  >     std::unique_ptr<Impl> pImpl;
  > };
  > 
  > #include <string>                   //跟之前一样，仍然在“widget.cpp”中
  > …
  >     
  > struct Widget::Impl { … };          //跟之前一样
  > 
  > Widget::Widget()                    //跟之前一样
  > : pImpl(std::make_unique<Impl>())
  > {}
  > 
  > Widget::~Widget() = default;        //跟之前一样
  > 
  > Widget::Widget(Widget&& rhs) = default;             //这里定义
  > Widget& Widget::operator=(Widget&& rhs) = default;
  > ```

- Pimpl惯用法是用来减少**类的实现和类使用者**之间的编译依赖的一种方法

- 允许**复制操作**，所以类`Widget`支持复制操作也很合理。 我们必须要自己来写这些函数

  > 在头文件里声明函数，而在实现文件里去实现他们
  >
  > ```cpp
  > class Widget {                          //仍然在“widget.h”中
  > public:
  >     …
  > 
  >     Widget(const Widget& rhs);          //只有声明
  >     Widget& operator=(const Widget& rhs);
  > 
  > private:                                //跟之前一样
  >     struct Impl;
  >     std::unique_ptr<Impl> pImpl;
  > };
  > 
  > #include <string>                   //跟之前一样，仍然在“widget.cpp”中
  > …
  >     
  > struct Widget::Impl { … };          //跟之前一样
  > 
  > Widget::~Widget() = default;		//其他函数，跟之前一样
  > 
  > Widget::Widget(const Widget& rhs)   //拷贝构造函数
  > : pImpl(std::make_unique<Impl>(*rhs.pImpl))
  > {}
  > 
  > Widget& Widget::operator=(const Widget& rhs)    //拷贝operator=
  > {
  >     *pImpl = *rhs.pImpl;
  >     return *this;
  > }
  > ```

---

### 换成`std::shared_ptr`

> 如果我们使用`std::shared_ptr`而不是`std::unique_ptr`来做`pImpl`指针， 我们会发现本条款的建议不再适用。**不需要在类`Widget`里声明析构函数**
>
> ```cpp
> class Widget {                      //在“widget.h”中
> public:
>     Widget();
>     …                               //没有析构函数和移动操作的声明
> 
> private:
>     struct Impl;
>     std::shared_ptr<Impl> pImpl;    //用std::shared_ptr
> };                                  //而不是std::unique_ptr
> ```

- `std::unique_ptr`和`std::shared_ptr`在`pImpl`指针上的表现上的区别的深层原因在于，他们**支持自定义删除器的方式不同**。

  > - 对`std::unique_ptr`而言，**删除器的类型是这个智能指针的一部分**
  >   - 让编译器有可能生成更小的运行时数据结构和更快的运行代码
  >   - `std::unique_ptr`指向的类型，在编译器的生成特殊成员函数（如析构函数，移动操作）被调用时，必须已经是一个完整类型
  > - 对`std::shared_ptr`而言，删除器的类型不是该智能指针的一部分
  >   - 会生成更大的运行时数据结构和稍微慢点的代码
  >   - 当编译器生成的特殊成员函数被使用的时候，指向的对象不必是一个完整类型。

---



### 总结

> [!note]
>
> - Pimpl惯用法通过减少在类实现和类使用者之间的编译依赖来减少编译时间。
> - 对于`std::unique_ptr`类型的`pImpl`指针，需要在头文件的类里声明特殊的成员函数，但是在实现文件里面来实现他们。即使是编译器自动生成的代码可以工作，也要这么做。
> - 以上的建议只适用于`std::unique_ptr`，不适用于`std::shared_ptr`。

---

