# 树

## 定义

- 一棵树是结点的一个有限集合T。

- 若T空，则称为空树。 

- 若T非空，则：

  - 有一个被称为根的结点，记 为`root(T) `； 
  - 其余结点被分成m(m >=0) 个 不相交的非空集合T1,T,…,Tm， 且T1, T2, …, Tm也都是树，其 称为`root(T)`的**子树**。(递归结构)

- 相关术语

  > - 度 ：一个结点的度指该结点的子结点的数目。其中一棵树的度为各结点的度的最大值。
  > - 叶结点：度为0的结点，即没有孩子节点的结点。
  > - 分支结点 ：度大于0的结点，即非叶结点
  > - 边：树中结点间的连线
  > - 层数/深度：根结点层数为0，其余结点的层数为其父结点的层数加1。
  > - 树的高度/深度：树中结点的最大层数
  > - 结点的高度：以该结点为根的子树的高度

- 对于二叉树

  > - 二叉树中第i层至多有2^i个结点，i>=0
  > - 高度为k的二叉树中至多有`2^(k+1)-1 (k>=0)`个结点
  > - 在n个结点构成的二叉树中，若叶结点即度为零的结点个数为n0 ，度为2的结点个数为n2 ，则有：`n0 = n2 ＋1`
  > - 特殊二叉树
  >   - 完全二叉树：
  >     - 除最下一层外，每一层都是满的（达到 最大结点数），
  >     - 最后一层结点从左至右出现
  >     - 对所有结点，按层次顺序从1开始编号，仅编号最大的非叶结点可以没有右孩子，其余非叶结点都有两个子结点
  >     - 知道总度数可以求出各个不同度的节点数，因为度为1只可以为`0或者1`
  >   - 满二叉树（特殊的完全二叉树）：
  >     - 叶节点都在最后一层
  >     - 每个非叶节点都有两个子节点

## 存储结构

### 顺序结构

将树的结点存放在数组里

或者我们这需要关注**各个结点的逻辑关系**而非各个结点的数据时，可用int数组,例如：对于第i个结点，父节点为tree[i]，特殊的根节点的没有父节点所以对应的值为本身或者一个负数，这个用法可用于哈夫曼树或者并查集

- 根节点存放在tree[0]，则`tree[i]`对应的左右子树分别为`tree[2*i+1]`,`tree[2*i+2]`，父节点为`tree[(i-1)/2](i>=1)`
- 根节点存放在tree[1]，则`tree[i]`对应的左右子树分别为`tree[2*i]`,`tree[2*i+1]`父节点为`tree[i/2]（i>0)`
- 比较适用于满二叉树和完全二叉树，对于普通的树未使用的空间较多

``` cpp
template<class T>
class Complete_BiTree
{
public:
	std::vector<T> tree;
};
```

### 链接存储

利用指针用类似链表的方式连接各个结点

```cpp
template<class T>
class BiTree
{
public:
	T data;//数据

	BiTree<T>* parent;//父节点,可有可无
	BiTree<T>* leftChild;//左子树
	BiTree<T>* rightChild;//右子树

	//左右子树是否为线索
	bool leftTag;
	bool rightTag;

	BiTree() = default;
};
```

### 重要操作

- 树的遍历（以链接存储为例）

  二叉树的遍历：按照一定次序访问二叉树中所有结点， 并且每个结点仅被访问一次的过程

  - 前序遍历(类似图的深度优先搜索DFS)，利用栈可以实现非递归。

    ```cpp
    //这里function不一定返回空，具体视情况而立,默认为输出data
    	void PreOrderTraverseTree(BiTree<T>* tree,/*处理函数*/std::function<void(T&)> address = [](T& e)->void {std::cout << e; })
    	{
    		//空树
    		if (!tree)
    		{
    			return;
    		}
    
    		//根节点
    		address(tree->data);
    
    		//遍历左子树
    		if (tree->leftChild && !tree->leftTag)
    		{
    			PreOrderTraverseTree(tree->leftChild, address);
    		}
    
    		//遍历右子树
    		if (tree->rightChild && !tree->rightTag)
    		{
    			PreOrderTraverseTree(tree->rightChild, address);
    		}
    
    		return;
    
    	}
    
    ```

    - 非递归

      ```cpp
      // 非递归前序遍历函数，使用栈模拟递归过程
      void Non_Recursive_PreOrderTraverseTree(BiTree<T>* tree,/*处理函数*/std::function<void(T&)> address = [](T& e)->void {std::cout << e; })
      {
          // 空树情况，直接返回
          if (!tree)
          {
              return;
          }
      
          // 初始化栈，用于保存遍历过程中的结点
          std::vector<BiTree<T>*> stack;
      
          BiTree<T>* current = tree; // 当前结点指向树的根结点
          
          // 当前结点非空或者栈非空时，继续遍历
          while (current || !stack.empty())
          {
              // 遍历到当前结点时
              if(current)
              {
                  // 处理当前结点（例如打印当前结点的数据）
                  address(current->data);
      
                  // 将当前结点压入栈中，以便后续回溯
                  stack.push_back(current);
      
                  // 转向当前结点的左子树继续遍历
                  current = current->leftChild;
              }
      
              // 当前结点为空但栈不为空时，需要回溯
              else
              {
                  // 从栈中弹出一个结点，恢复到上一个结点
                  current = stack.back();
      
                  // 弹出栈顶结点
                  stack.pop_back();
      
                  // 转向当前结点的右子树继续遍历
                  current = current->rightChild;
              }
          }
      }
      
      ```

      

  - 中序遍历，利用栈实现非递归。

    ```cpp
    void InOrderTraverseTree(BiTree<T>* tree,/*处理函数*/std::function<void(T&)> address = [](T& e)->void {std::cout << e; })
    	{
    		//空树
    		if (!tree)
    		{
    			return;
    		}
    
    		//遍历左子树
    		if (tree->leftChild && !tree->leftTag)
    		{
    			InOrderTraverseTree(tree->leftChild, address);
    		}
    
    		//根节点
    		address(tree->data);
    
    		//遍历右子树
    		if (tree->rightChild && !tree->rightTag)
    		{
    			InOrderTraverseTree(tree->rightChild, address);
    		}
    
    		return;
    
    	}
    ```

    - 非递归

    ```cpp
    // 非递归中序遍历函数，使用栈模拟递归过程
    void Non_Recursive_InOrderTraverseTree(BiTree<T>* tree, /*处理函数*/std::function<void(T&)> address = [](T& e)->void {std::cout << e; })
    {
        // 空树情况，直接返回
        if (!tree)
        {
            return;
        }
    
        // 初始化栈，用于保存遍历过程中的结点
        std::vector<BiTree<T>*> stack;
    
        BiTree<T>* current = tree; // 当前结点指向树的根结点
    
        // 当前结点非空或者栈非空时，继续遍历
        while (current || !stack.empty())
        {
            // 遍历到当前结点的左子树
            if (current)
            {
                // 将当前结点压入栈中，以便后续回溯
                stack.push_back(current);
                // 转向左子树继续遍历
                current = current->leftChild;
            }
    
            // 当前结点为空但栈不为空时，需要回溯
            else if (!stack.empty())
            {
                // 从栈中弹出一个结点，恢复到上一个结点
                current = stack.back();
                // 弹出栈顶结点
                stack.pop_back();
    
                // 处理当前结点（例如打印当前结点的数据）
                address(current->data);
    
                // 转向当前结点的右子树继续遍历
                current = current->rightChild;
            }
        }
    }
    
    ```

    

  - 后序遍历

    ```cpp
    void PostOrderTraverseTree(BiTree<T>* tree,/*处理函数*/std::function<void(T&)> address = [](T& e)->void {std::cout << e; })
    	{
    		//空树
    		if (!tree)
    		{
    			return;
    		}
    
    		//遍历左子树
    		if (tree->leftChild && !tree->leftTag)
    		{
    			InOrderTraverseTree(tree->leftChild, address);
    		}
    
    		//遍历右子树
    		if (tree->rightChild && !tree->rightTag)
    		{
    			InOrderTraverseTree(tree->rightChild, address);
    		}
    
    		//根节点
    		address(tree->data);
    
    		return;
    
    	}
    ```

    - 非递归

    ```cpp
    void Non_Recursive_PostOrderTraverseTree(BiTree<T>* tree, /*处理函数*/ std::function<void(T&)> address = [](T& e)->void { std::cout << e; })
    {
        // 空树情况，直接返回
        if (!tree)
        {
            return;
        }
    
        // 初始化栈，用于保存遍历过程中的结点
        std::vector<BiTree<T>*> stack;
    
        BiTree<T>* current = tree; // 当前结点指向树的根结点
        BiTree<T>* lastVisite = nullptr; // 记录上一个被访问的结点，用于判断右子树是否已访问
    
        // 当前结点非空或者栈非空时，继续遍历
        while (current || !stack.empty())
        {
            // 遍历到当前结点的左子树
            if (current)
            {
                stack.push_back(current); // 将当前结点压入栈中
                current = current->leftChild; // 转向左子树
            }
            else
            {
                // 当前结点为空，回溯到栈顶结点
                BiTree<T>* top = stack.back();
    
                // 如果右子树存在且未访问，则遍历右子树
                if (top->rightChild && lastVisite != top->rightChild)
                {
                    current = top->rightChild; // 转向右子树
                }
                else
                {
                    // 右子树为空或者已访问
                    address(top->data); // 处理当前结点
                    lastVisite = top; // 更新上一个访问的结点
    
                    stack.pop_back(); // 弹出栈顶结点
                }
            }
        }
    }
    
    ```

    

    - 层次遍历（类似图的广度优先搜索BFS）

      ```cpp
      void LevelOrderTraverseTree(BiTree<T>* tree,/*处理函数*/std::function<void(T&)> address = [](T& e)->void {std::cout << e; })
      	{
      		//空树
      		if (!tree)
      		{
      			return;
      		}
      
      		std::queue<BiTree<T>*> trees;
      		trees.push(tree);
      
      		while (!trees.empty())
      		{
      			BiTree<T>* p = trees.front();
      			trees.pop();
      
      			address(p->data);
      
      			//左子树
      			if (p->leftChild && !p->leftTag)
      			{
      				trees.push(p->leftChild);
      			}
      
      			//遍历右子树
      			if (p->rightChild && !p->rightTag)
      			{
      				trees.push(p->rightChild);
      			}
      
      		}
      		return;
      
      	}
      ```

- 树和二叉树的转换（**树使用兄弟儿子表示法**）

## 应用

- 先根序列个数为n的不同二叉树的个数为**卡特兰数**

- 线索二叉树：利用**节点的空指针**指向结点的某个序列的前驱和后继

- 哈夫曼树

  - 构造

    > - 一类带权路径长度最短的树。（用于不等长最优编码等）
    > - 在哈夫曼树中，权值越大的结点离根结点越近。
    > - 依次找到最小的两个节点组成一棵树直到所有节点都有根节点

  - 编码：

    > - 在构造哈夫曼树之后，求哈夫曼编码的主要思想是：依次以叶子为出发点，向上回溯至根结点为止。 
    > - 回溯时走左分支则生成代码 0, 走右分支则生成代码 l

  - 译码：

    > - **初始化**：从根节点开始，遍历二进制编码字符串。
    >
    > - **遍历路径**：
    >   - 每个`'0'`表示向左子树移动，`'1'`表示向右子树移动。
    >   - 每当到达叶子节点，就记录该节点编号即译出一个字符，并重新从根节点开始译码。
    >
    > - **结束判断**：若最终到达叶子节点，返回所有编号；否则该串无法译码为非法序列。
    >
    > 

- 并查集

  - 一种用于管理元素所属集合的数据结构，实现为一个森林

  - 其中每棵树表示一个集合，树中的节点表示对应集合中的元素。

  - 优化搜索

    > - 压缩路径
    >   - 查询过程中经过的每个元素都属于该集合，我们可以将其直接连到根节点以加快后续查询。
    >
    > ```cpp
    > size_t find(size_t x)
    > 	{
    > 		return pa[x] == x ? x : pa[x]=find(pa[x]);
    > 	}
    > ```
    >
    > - 小树并入大树(按秩合并)
    >
    > ```cpp
    > // 合并两个集合，x 和 y 所在的集合进行合并，按秩合并策略
    > size_t unite(size_t x, size_t y)
    > {
    >     // 找到 x 和 y 所在集合的根节点
    >     x = find(x);
    >     y = find(y);
    > 
    >     // 如果 x 和 y 已经在同一个集合中，无需合并，直接返回
    >     if (x == y) return;
    > 
    >     // 按秩合并，始终将小树合并到大树上
    >     // 如果 x 的树小于 y 的树，将 x 和 y 交换，确保 x 是较大的树的根
    >     if (size[x] < size[y])
    >     {
    >         std::swap(x, y); // 交换 x 和 y，确保 x 是较大的树根
    >     }
    > 
    >     // 将 y 的根节点合并到 x 的根节点
    >     pa[y] = x;  // 更新父节点数组，将 y 的父节点设为 x，表示 y 的根节点为 x
    > 
    >     // 更新 x 所在树的大小，将 x 的集合大小加上 y 集合的大小
    >     size[x] += size[y]; // size[x] 累加 size[y]，更新 x 集合的大小
    > }
    > 
    > ```

    - 集合数：如果一个节点的根指向自己，则为整棵树的根即一个集合。

- 二叉查找树

- AVL树

- 红黑树

