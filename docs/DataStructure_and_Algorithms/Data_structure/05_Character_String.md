# 字符串

## 定义

- 串(string)(或字符串）是由零个或多个字符组成的**有限序列**
- 串中字符的数目n称为串的长度
- 零个字符的串称为空串(null string) , 其长度为零

## 应用

- 模式匹配：

  - 朴素模式匹配：经典的暴力匹配算法实现（BF算法）

  ```cpp
  int BF(std::string S, std::string T, int pos)
  {
      // 检查pos是否合法，pos小于0或pos+T的长度超过S的长度都返回-1
      if (pos < 0 || pos + T.size() > S.size())
      {
          return -1; // pos错误
      }
  
      // 初始化i为搜索起始位置，j为T中正在匹配的字符位置
      int i = pos;
      int j = 0;
  
      // 开始匹配，直到S或T遍历完
      while (i < S.size() && j < T.size()) 
      {
          // 如果S[i]和T[j]字符相等，则继续向后匹配
          if (S[i] == T[j])
          {
              i++;  // S指针后移
              j++;  // T指针后移
          }
          else // 如果不匹配，回溯i，并从T的开头重新开始匹配
          {
              i = i - j + 1;  // i回溯到匹配失败后的位置
              j = 0;  // T重新从头开始匹配
          }
      }
  
      // 如果j已经匹配到T的末尾，则说明匹配成功，返回匹配的起始位置
      if (j >= T.size())
      {
          return i - T.size();  // 返回匹配成功的位置
      }
      else // 如果没有完全匹配，返回-1表示匹配失败
      {
          return -1;
      }
  }
  ```

  

  - KMP:
    - 利用“部分匹配表”（即 `next` 数组）来优化暴力匹配的过程，避免了不必要的字符比较,重点就在于next数组的创建


  ```cpp
int index(std::string S, std::string T, int pos)
{
    // 创建一个shared_ptr动态数组用于存储T的next数组
    std::shared_ptr<int[]> next(new int[T.size()], std::default_delete<int[]>());

    // 计算T的next数组
    get_next(T, next);

    // 初始化i, j为匹配指针，i指向S，j指向T
    int i = 0;
    int j = 0;

    // 获取S和T的长度
    int sl = S.size();
    int tl = T.size();

    // KMP匹配过程：若字符匹配成功（S[i] == T[j]），或者j == -1（表示跳过不匹配的字符），则继续比较下一个字符
    while (i < sl && j < tl)
    {
        if (j == -1 || S[i] == T[j]) // 如果j == -1或字符匹配，则i和j都加1
        {
            i++;
            j++;
        }
        else // 如果字符不匹配，且j != -1，则根据next数组调整j的位置
        {
            j = next[j]; // 将j跳到next[j]的位置，避免不必要的字符比较
        }

        // Debug代码：输出匹配过程中的状态
        /*std::cout << S.size() << " " << T.size() << std::endl;
        std::cout << i << " " << j << std::endl;
        if (j < T.size()) { std::cout << "ozy"; }
        system("Pause");*/
    }

    // 如果j达到了T的末尾，说明匹配成功，返回匹配的起始位置
    if (j == T.size())
    {
        return i - T.size();  // 返回匹配开始的位置
    }
    else // 如果j未能到达T的末尾，说明匹配失败，返回-1
    {
        return -1;
    }
}

// 计算字符串T的next数组
void get_next(std::string T, std::shared_ptr<int[]>& next)
{
    next[0] = -1;  // next数组的第一个位置默认是-1
    int k = -1;     // k表示当前最长前后缀的长度
    int j = 0;      // j用于遍历T字符串的字符

    // 计算T字符串的next数组，构建部分匹配表
    while (j < T.size() - 1) // 注意这里j < T.size() - 1，避免越界
    {
        // 如果k == -1表示没有匹配的前后缀，或者T[j]和T[k]相等
        if (k == -1 || T[j] == T[k])
        {
            ++k;  // 扩大前缀长度
            ++j;  // 移动j，继续处理下一个字符
            next[j] = k;  // 将当前j的next值设为k
        }
        else // 如果T[j]与T[k]不相等，根据next数组递归查找更短的前后缀
        {
            k = next[k];  // 将k回退到next[k]的位置
        }
    }
}

  ```

  

  - 注意next数组的意义以及和失败函数fail的区别:

    > [!warning]
    >
    > - `next[j] = fail[j-1]+1`
    > - next[j]为在string[0,j-1]子字串的最大相等前后缀的长度加一，即**跳转的位置**
    > - fail[j]为string[0,j]子字串的最大相等前后缀的长度。
    > - 对于next数组的优化：如果跳转位置的字符`string[ next[j] ]`和`string[j]`相同，即跳转后依旧匹配失败继续跳转，所以可以将`next[j]=next[ next[j] ]`。

