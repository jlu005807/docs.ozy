# 图

## 定义

图(Graph) G由两个集合V和E组成，记为G=(V,E) , 其中V是顶点的有穷非空集合， E是V中顶点偶对的有穷集合，这些顶点偶对称为边。

## 存储结构

- 边存储

  将各个点的关系利用边存起来

  ```cpp
  struct Edge
  {
  	//存储边节点的编号
  	//u->v
  	int u;
  	int v;
  
  	//加入权值
  	int weight;
  
  	Edge() = default;
  
  	Edge(int _u, int _v,int weight=1) :u(_u), v(_v),weight(weight){	}
  };
  
  ```

  

- 邻接表（稀疏图）

  用顶点表将各个邻接点利用链接结构存放起来

  ```cpp
  //边结点
  //边链表中边结点包括邻接点域(adjvex)、数据域(info) 和链域(nextarc) 三部分
  //邻接点域指示与顶点V; 邻接的点在图中的位置；数据域存储和边相关的信息， 如权值等；链域指示与顶点v邻接的下一条边的结点。
  template<class T=int>//默认为int
  class ArcNode
  {
  public:
  	//该边所指向的顶点位置，如果为有向边则为弧头
  	int adjvex;
  
  	//指向下一条边的指针
  	std::shared_ptr<ArcNode<T>> nextarc;
  
  	//边信息，如权值,默认无信息
  	T info;
  
  	ArcNode() = default;
  
  	ArcNode(int vex) :adjvex(vex),info(1),nextarc(nullptr){ }
  
  	ArcNode(int vex,T info) :adjvex(vex),info(info), nextarc(nullptr) { }
  
  };
  
  template<class K = int, class T = int>
  class Adj_List
  {
  public:
  	//表头结点表，此vector.size()即顶点数,所以不需要记录顶点数
  	std::vector<VexNode<K, T>> vertices;
  
  	//记录边数
  	int arcnum;
  
  	//是否为有向图
  	bool is_direct;
  };
  ```

  - 对于链式结构的的邻接表，可以使用变为使用数组存放边的**前向星**

  ```cpp
  // 边类定义，包含两个成员变量：目标节点v和权重w
  class edge
  {
  public:
      int v;  // 目标节点
      int w;  // 边的权重
  
      // 构造函数，初始化目标节点和边的权重
      edge(int _v, int _w) :v(_v), w(_w){ }
  };
  
  // 存储图的邻接表(前向星)，vextices[i]表示节点i的所有边
  vector<vector<edge>> vextices;
  
  ```

  

- 邻接矩阵（稠密图）

  - 利用矩阵(即二维数组）将各个点是否存在边的信息存放起来


```cpp
//使用一个二维数组 adj 来存边，其中 adj[u][v] 为 1 表示存在 u 到 v 的边，为 0 表示不存在。
//如果是带边权的图，可以在 adj[u][v] 中存储 u 到 v 的边的边权。
//默认顶点到自身没有边
//并且二维数组难以改变结构所以不考虑增加和删除节点但是可以增删边，并且二维数组空间大不适用于稀疏图
//其实无向图为对称矩阵可以压缩为一维数组存放，但是实现逻辑相似不考虑分离  
//小技巧：对于有向无向图图，并且规定没有弧为0，有弧为1，则矩阵A^n[i][j]的值表示从顶点i到顶点j中路径长度为n的数目

class Adj_Matrix
{
public:
	std::vector<std::vector<int>> graph;

	//标志是否为有向图
	bool is_direct;

	Adj_Matrix() = default;

	//顶点数量number,依旧从零开始,当weight默认时表示无权图
	Adj_Matrix(int number,bool direct=false, int weight = INT_MAX):is_direct(direct)
	{
		graph.resize(number, std::vector<int>(number,weight));
	}
};

```

- 对于邻接表和邻接矩阵的比较
  - 首先是，邻接表适用于稀疏图，邻接矩阵适用于稠密图
  - 判断两个顶点是否存在边或者查询修改边的信息，邻接表O(n)（n表示该点的出度），邻接矩阵O(1)，所以频繁查询和修改边的信息则邻接矩阵更合适
  - 对于需要增删顶点则邻接表更适合

## 应用(重要操作)

都以邻接矩阵为例

- DFS:深度优先搜索，非递归时使用栈

```cpp
//深度优先搜索（DFS）算法,并对节点进行处理,vis保存是否访问
	void dfs(int u, std::vector<bool>& vis, const Adj_Matrix& adj, std::function<void(int&)> address = [](int& u)->void {std::cout << u; })
	{
		//访问过或者u不合法
		if (u<0||u>=vis.size()||vis[u])
		{
			return;
		}

		//标记已访问
		vis[u] = true;

		address(u);

		//递归搜索
		for (int i = 0; i < vis.size(); i++)
		{
			//存在邻接点
			if (adj.graph[u][i] != INT_MAX)
			{
				dfs(i, vis,adj,address);
			}
		}
	}
```

- 非递归

```cpp
//深度优先搜索（DFS）算法的非递归形式，类似于广度优先，但这里使用栈
	void dfs_non_recursive(int start, std::vector<bool>& vis, const Adj_Matrix& adj, std::function<void(int&)> address = [](int& u)->void {std::cout << u; })
	{
		//已经访问过或者start不合法
		if (vis[start] || start < 0 || start >= vis.size())return;

		std::vector<int> q;//存放当前连通分支节点

		q.push_back(start);//将起始节点入栈

		vis[start] = true;// 标记为已访问

		//栈不为空，即当前连通分支还有未访问的节点
		while (!q.empty())
		{
			int u = q.back(); // 获取栈顶的节点

			q.pop_back();           // 出栈

			address(u);       // 处理当前节点

			// 遍历当前顶点，找到所有邻接并且未访问的节点加入队列
			for (int i = 0; i < adj.graph.size(); i++)
			{
				if (adj.graph[u][i] != INT_MAX && !vis[i])
				{
					vis[i] = true;// 标记为已访问
					q.push_back(i);     // 将邻接节点入栈
				}
			}
			
		}
	}
```



- BFS:广度优先搜索

  - 非递归利用队列（类似树的层次遍历）
  - 可用于单源无权（权值为1）最短路

  ```cpp
  //广度优先搜索（BFS）算法（非递归）,并对节点进行处理,vis保存是否访问
  	void bfs(int start, std::vector<bool>& vis, const Adj_Matrix& adj, std::function<void(int&)> address = [](int& u)->void {std::cout << u; })
  	{
  		//已经访问过或者start不合法
  		if (vis[start] || start < 0 || start >= vis.size())return;
  
  		std::queue<int> q;//存放当前连通分支节点，并要着start节点一圈圈增加
  
  		vis[start] = true;//标记初始点访问
  
  		q.push(start);//将起始节点入队
  
  		//队列不为空，即当前连通分支还有为访问的节点
  		while (!q.empty())
  		{
  			int u = q.front(); // 获取队列前端的节点
  
  			q.pop();           // 出队
  
  			address(u);       // 处理当前节点
  
  			// 遍历当前顶点，找到所有邻接并且未访问的节点加入队列
  			for (int i=0;i<adj.graph.size();i++)
  			{
  				if (adj.graph[u][i] != INT_MAX && !vis[i])
  				{
  					vis[i] = true;// 标记为已访问
  					q.push(i);     // 将邻接节点入队
  				}
  			}
  		}
  	}
  ```

  

- **拓扑序列**：AOV网是一个有向无环图，可以用于证明图是否有环

  > 1. 选择一个入度为0的顶点并输出
  >
  > 2. 删除该顶点及该顶点引出的所有边
  >
  > 3. 执行①②，直至所有顶点已输出，或图中剩余顶点 入度均不为0（说明存在环，无法继续拓扑排序）
  > 4. 对于任何无环的AOV网，其顶点均可排成拓扑序列， 其拓扑序列**未必唯一**
  > 5. 拓展：如果图存在拓扑序列，则**DFS可以输出拓扑序的逆序**
  >
  > ```cpp
  > std::vector<int> TopologicalSort(const Adj_Matrix& adj)
  > {
  >     // 如果是无向图，无法进行拓扑排序
  >     if (!adj.is_direct)
  >     {
  >         std::cerr << "Graph doesn't have direction, topological sorting not possible." << std::endl;
  >         return {};
  >     }
  > 
  >     int number = adj.graph.size();  // 获取图中节点数量
  > 
  >     std::vector<int> Topo;          // 存储拓扑排序结果
  >     std::queue<int> zero_in_degree; // 存储入度为0的节点
  > 
  >     // 存放各个节点的入度
  >     std::vector<int> indegree(number, 0);
  > 
  >     // 计算每个节点的入度
  >     for (int u = 0; u < number; u++)
  >     {
  >         for (int v = 0; v < number; v++)
  >         {
  >             // 如果存在边 u -> v，v的入度增加
  >             if (adj.graph[u][v] != INT_MAX)
  >             {
  >                 indegree[v]++;
  >             }
  >         }
  >     }
  > 
  >     // 将入度为0的节点放入队列
  >     for (int i = 0; i < number; i++)
  >     {
  >         if (indegree[i] == 0)
  >         {
  >             zero_in_degree.push(i);
  >         }
  >     }
  > 
  >     // Kahn算法：处理入度为0的节点
  >     while (!zero_in_degree.empty())
  >     {
  >         // 从队列中取出一个节点
  >         int u = zero_in_degree.front();
  >         zero_in_degree.pop();
  > 
  >         // 将该节点加入拓扑排序结果
  >         Topo.push_back(u);
  > 
  >         // 遍历该节点的所有邻接节点
  >         for (int i = 0; i < number; i++)
  >         {
  >             // 如果有边 u -> i，i的入度减一
  >             if (adj.graph[u][i] != INT_MAX)
  >             {
  >                 indegree[i]--;
  > 
  >                 // 如果i的入度为0，加入队列
  >                 if (indegree[i] == 0)
  >                 {
  >                     zero_in_degree.push(i);
  >                 }
  >             }
  >         }
  >     }
  > 
  >     // 检查是否存在环：如果拓扑排序结果的节点数不等于图的节点数，说明图中有环
  >     if (Topo.size() != number)
  >     {
  >         std::cerr << "Graph has a cycle, topological sorting not possible." << std::endl;
  >         return {};
  >     }
  > 
  >     // 返回拓扑排序结果
  >     return Topo;
  > }
  > 
  > ```
  >
  > 

- **关键路径**：完成整个工程所需的最短时间取决于从源点到汇点的最长路径长度

  > - 关键活动：活动的**最早开始时间等于活动 A 的最迟开始时间**， 即`l(i)＝e(i)`,也是不可以拖延的活动
  > - 关键路径：由关键活动组成的路径，亦即源点到汇点的最长路径，可能不止一条
  >
  > 1. 对AOE网求各顶点vj的最早发生时间ve(j)
  > 2. 求各顶点vj的最迟发生时间vl(j)；
  > 3. 求出各活动ai的最早开始时间e(i)和 最迟开始时间l(i)，若e(i)=l(i)，则ai是关键活动
  > 4. 具体算法
  >    1. 求出拓扑排序，若网中有环则终止算法，按拓扑序求出各顶点的最早发生时间ve
  >    2. 按逆拓扑序求各顶点的最迟发生时间vl
  >    3. 根据ve和vl的值，求各活动的最早开始时间e与最迟开始时间l，若`e=l`，则对应活动是关键活动，其中最晚开始时间和最早开始时间的差值为活动的**时间余量**。
  >    4. 因为拓扑序列不唯一，所以关键路径也不唯一。
  >
  > ```cpp
  > //关键路径不唯一
  > std::vector<int> CriticalPath(const Adj_Matrix& adj)
  > {
  >     // 检查是否为无向图
  >     if (!adj.is_direct)
  >     {
  >         std::cerr << "Graph doesn't have direction, CriticalPath not possible." << std::endl;
  >         return {};
  >     }
  > 
  >     int number = adj.graph.size();  // 获取图中节点数量
  > 
  >     // 获取拓扑排序
  >     std::vector<int> Topo = TopologicalSort(adj);
  > 
  >     // 如果拓扑排序为空，表示图中存在环，无法进行关键路径计算
  >     if (Topo.empty())
  >     {
  >         std::cout << "图中存在环，无法计算关键路径。" << std::endl;
  >         return {};
  >     }
  > 
  >     // 初始化边的数量
  >     int edge_num = 0;
  > 
  >     // 初始化每个节点的最早发生时间（VE），开始点的 VE 为0
  >     std::vector<int> VE(number, 0);
  > 
  >     // 计算每个节点的 VE
  >     for (int u = 0; u < Topo.size(); u++)
  >     {
  >         for (int v = 0; v < number; v++)
  >         {
  >             // 如果存在边 u -> v，更新 v 的 VE
  >             if (adj.graph[u][v] != INT_MAX)
  >             {
  >                 VE[v] = std::max(VE[v], VE[u] + adj.graph[u][v]);
  >                 edge_num++;  // 计算边的数量
  >             }
  >         }
  >     }
  > 
  >     // 初始化每个节点的最晚发生时间（VL），结束点的 VL 为 VE[number - 1]
  >     std::vector<int> VL(number, VE[number - 1]);
  > 
  >     // 逆拓扑排序计算每个节点的 VL
  >     for (auto it = Topo.rbegin(); it != Topo.rend(); it++)
  >     {
  >         int u = *it;
  >         for (int i = 0; i < number; i++)
  >         {
  >             if (adj.graph[u][i] != INT_MAX)
  >             {
  >                 VL[u] = std::min(VL[u], VL[i] - adj.graph[u][i]);
  >             }
  >         }
  >     }
  > 
  >     // 计算关键路径上的活动（弧的最早开始时间和最晚开始时间相同）
  >     std::vector<int> critical_adjpath;
  > 
  >     // 遍历拓扑排序中的每个节点，检查哪些弧是关键路径
  >     for (int u = 0; u < Topo.size(); u++)
  >     {
  >         for (int v = 0; v < number; v++)
  >         {
  >             // 如果存在边 u -> v，计算其最早开始时间 ET 和最晚开始时间 LT
  >             if (adj.graph[u][v] != INT_MAX)
  >             {
  >                 int ET = VE[u];  // 最早开始时间
  >                 int LT = VL[v] - adj.graph[u][v];  // 最晚开始时间
  > 
  >                 // 如果 ET == LT，则该弧是关键路径
  >                 if (ET == LT)
  >                 {
  >                     // 如果 critical_adjpath 为空，加入首尾节点
  >                     if (critical_adjpath.empty())
  >                     {
  >                         critical_adjpath.push_back(u);
  >                         critical_adjpath.push_back(v);
  >                     }
  >                     // 如果首尾节点相接，直接添加尾节点
  >                     else if (critical_adjpath.back() == u)
  >                     {
  >                         critical_adjpath.push_back(v);
  >                     }
  >                 }
  >             }
  >         }
  >     }
  > 
  >     // 输出项目的最早完成时间
  >     std::cout << "项目的最早完成时间为：" << VE[number - 1] << std::endl;
  > 
  >     // 返回关键路径
  >     return critical_adjpath;
  > }
  > 
  > ```
  >
  > 

- 最短路径

  - 无权图的单源最短路径问题：BFS

    > - BFS过程中，当访问某个顶点时，就确定了该点与源点的最 短距离
    > - 通过BFS，从源点开始由近及远求各顶点的最短路径v
    >
    > ```cpp
    > // 找到无权最短路径，图中所有边权值为1，求点v到其他各个点的最短路径和最短路径长度
    > // path[i] 记录从 v 到 i 的最短路径上顶点 i 的前驱结点
    > // dist[i] 记录从 v 到 i 的最短路径长度
    > void ShortestPath(const Adj_Matrix& adj, int v, std::vector<int>& dist, std::vector<int>& path)
    > {
    >     // dist 和 path 的初始化由调用方完成
    >     int number = dist.size(); // 获取图中顶点的数量
    > 
    >     // 创建一个队列用于广度优先搜索（BFS）
    >     std::queue<int> Q;
    >     Q.push(v); // 将起点 v 入队
    > 
    >     // 起点到自身的距离为0
    >     dist[v] = 0;
    > 
    >     // 求 v 到其他各个顶点的最短路径，类似于图的 BFS
    >     while (!Q.empty())
    >     {
    >         // 处理队头的顶点 u
    >         int u = Q.front();
    >         Q.pop();
    > 
    >         // 遍历当前点 u 的所有边（邻接节点）
    >         for (int i = 0; i < number; i++)
    >         {
    >             // 如果存在边 u -> i（即图中有连接）
    >             if (adj.graph[u][i] != INT_MAX)
    >             {
    >                 int k = i;  // 邻接点 k
    > 
    >                 // dist[k] == -1 表示未访问过该节点
    >                 if (dist[k] == -1)
    >                 {
    >                     // 将未访问的邻接点 k 入队
    >                     Q.push(k);
    > 
    >                     // 更新 dist[k] 为 u 到 k 的距离，等于 u 到起点的距离加 1
    >                     dist[k] = dist[u] + 1;
    > 
    >                     // 更新 k 的前驱节点为 u
    >                     path[k] = u;
    >                 }
    >             }
    >         }
    >     }
    > }
    > ```
    >
    > 

  - 正权图的单源最短路径问题：Dijkstra算法

    > - 找到各个局部最优路（任意最短路的前缀，也是一条最短路）
    > - 初始化起点到其他点距离
    > - 找局部最优路
    > - 从局部最优路更新到其他点的距离
    > - 重复直到所有点的最优路找到
    > - 可以利用优先队列（斐波那契堆）优化找局部最优路的步骤
    >
    > ```cpp
    > //利用优先队列维护最短路长度最小的结点，适用于稀疏图
    > 	void Dijkstra_ShortestPath_optimize(const Adj_Matrix& adj, int v, std::vector<bool>& vis, std::vector<int>& dist, std::vector<int>& path)
    > 	{
    > 		//创建优先队列，利用pair<T,int>分别存放距离，节点,默认T有greater
    > 		std::priority_queue<std::pair<int, int>, std::vector<std::pair<int, int>>, std::greater<std::pair<int, int>>> pq;
    > 
    > 		//初始化
    > 		dist[v] = 0;
    > 
    > 		//放入队列
    > 		pq.push({ 0,v });
    > 
    > 		//直到队列为空则完成
    > 		while (!pq.empty())
    > 		{
    > 			//取当前最短路长度最小的结点
    > 			std::pair<int, int> node = pq.top();
    > 			pq.pop();
    > 
    > 			//如果此点已经找到最小路径即局部最优路
    > 			int u = node.second;
    > 			if (vis[u])continue;
    > 
    > 			////如果有已经更新的最短路径,放弃这个记录
    > 			//if (node.first > dist[u])continue;
    > 			//此操作和上面判断相同
    > 
    > 			//标记
    > 			vis[u] = true;
    > 
    > 			//更新从此点出发的其他点最短路径
    > 			for(int i=0;i<adj.graph.size();i++)
    > 			{
    > 				//更小则更新
    > 				if (adj.graph[u][i] != INT_MAX && dist[u] + adj.graph[u][i] < dist[i])
    > 				{
    > 					//更新路径和前驱并放入队列
    > 					dist[i] = dist[u] + adj.graph[u][i];
    > 					path[i] = u;
    > 					pq.push({ dist[i] ,i });
    > 				}
    > 			}
    > 		}
    > 	}
    > ```
    >
    > 

  - 正权图的多源最短路径问题

    - 多次Dijkstra算法

    - Floyd算法（多用于邻接矩阵）

      > - 算法通过三重循环来更新最短路径。外层循环通过引入一个中间点 `k`，判断是否可以通过中间点 `k` 来缩短从 `i` 到 `j` 的路径。
      > - 如果通过 `k` 的路径更短，则更新 `dist[i][j]`，并且更新前驱节点 `path[i][j]` 为通过 `k` 到达 `j` 的前驱节点。
      >
      > ```cpp
      > void Floyd_ShortestPath(const Adj_Matrix& adj)
      > {
      >     // 将从Vi到Vj的最短路径长度初始化为邻接矩阵中的值
      >     std::vector<std::vector<int>> dist, path;
      > 
      >     // 初始化dist和path，大小与邻接矩阵相同
      >     dist.resize(adj.graph.size(), std::vector<int>(adj.graph.size(), 0));
      >     path.resize(adj.graph.size(), std::vector<int>(adj.graph.size(), -1));
      > 
      >     // 初始化dist和path
      >     for (int i = 0; i < adj.graph.size(); i++)
      >     {
      >         for (int j = 0; j < adj.graph.size(); j++)
      >         {
      >             dist[i][j] = adj.graph[i][j];
      > 
      >             // 如果i和j之间有边，则设置j的前驱为i
      >             if (dist[i][j] < INT_MAX)
      >                 path[i][j] = i; 
      >         }
      >     }
      > 
      >     // 使用三重循环来计算最短路径
      >     for (int k = 0; k < adj.graph.size(); k++)  // 中间点
      >     {
      >         for (int i = 0; i < adj.graph.size(); i++)  // 起点
      >         {
      >             if(i == k)continue;
      >             for (int j = 0; j < adj.graph.size(); j++)  // 终点
      >             {
      >                 if(j == k || j == i)continue;
      >                 // 如果通过k能得到更短的路径
      >                 if (dist[i][k] + dist[k][j] < dist[i][j])
      >                 {
      >                     // 更新最短路径长度
      >                     dist[i][j] = dist[i][k] + dist[k][j];
      > 
      >                     // 更新路径的前驱节点
      >                     path[i][j] = path[k][j];
      >                 }
      >             }
      >         }
      >     }
      > 
      >     // 打印结果（可以添加打印逻辑）
      > }
      > 
      > ```
      >
      > 

- 最小支撑树：边权之和最小的支撑树称为G的最小支撑树

  - Prim算法（加点法）

    > - 选择任一点u做为起点，放入集合S，即令S={u}(u属于V)；
    > - 找最小跨集合边(u, v) ，即端点分别属于集合S和V-S且权值 最小的边，将该边加入最小支撑树，并将点v放入S；
    > - 执行②，直至S=V
    >
    > ```cpp
    > // 普里姆算法优化，使用优先队列
    > Adj_Matrix MiniSpanTree_Prim(const Adj_Matrix& adj, int u = 0 /*起始点*/) {
    >     // 非连通图，返回空图
    >     if (Connected_Component(adj) != 1) {
    >         return Adj_Matrix(0);
    >     }
    > 
    >     int n = adj.graph.size();  // 图的顶点数
    >     Adj_Matrix MiniSpanTree(n, adj.is_direct);  // 最小生成树
    > 
    >     // 记录顶点是否已经加入生成树
    >     std::vector<bool> vis(n, false);
    > 
    >     // 使用优先队列（最小堆）保存未加入生成树的点和其对应的最小边权值
    >     // 队列中存储的是 (边权值, 顶点) 的 pair
    >     std::priority_queue<std::pair<int, int>, std::vector<std::pair<int, int>>, std::greater<>> pq;
    > 
    >     // 初始化：从起始点u开始，加入队列，权值为0
    >     pq.push({0, u});
    > 
    >     // 选择其他n-1个顶点，生成n-1条边
    >     while (!pq.empty()) {
    >         // 取出当前权值最小的边
    >         int current_weight = pq.top().first;
    >         int u0 = pq.top().second;
    >         pq.pop();
    > 
    >         // 如果顶点u0已经加入生成树，则跳过
    >         if (vis[u0]) continue;
    > 
    >         // 标记u0为已访问
    >         vis[u0] = true;
    > 
    >         // 更新最小生成树的边
    >         if (u0 != u) {  // 排除起始点
    >             int v0 = pq.top().second;  // 顶点u0的前驱
    >             MiniSpanTree.graph[u0][v0] = current_weight;
    > 
    >             // 无向图则增加对称边
    >             if (!MiniSpanTree.is_direct) {
    >                 MiniSpanTree.graph[v0][u0] = current_weight;
    >             }
    >         }
    > 
    >         // 更新与u0的相邻节点的最小边，并加入优先队列
    >         for (int i = 0; i < n; i++) {
    >             if (!vis[i] && adj.graph[u0][i] < INT_MAX) {  // 如果i未访问且有边
    >                 pq.push({adj.graph[u0][i], i});
    >             }
    >         }
    >     }
    > 
    >     // 返回生成的最小生成树
    >     return MiniSpanTree;
    > }
    > ```
    >
    > 

  - Kruskal算法（逐边加入）所以不针对邻接矩阵为例

    > - 在G中选择权值最小的边，并将此边从G中删除
    > - 若该边加入T后不产生环（即此边的两个端点在T的不同连 通分量中），则将此边加入T中，从而使T减少一个连通分 量，否则本步骤无操作，对于是否产生环可以利用并查集
    > - 重复①②直至T中仅剩一个连通分量
    >
    > ```cpp
    > //克鲁斯卡尔 (Kruskal)算法，可称为“加边法”，适用于稀疏图
    > 	//每次选出权值最小并且无法使现有的树形成环的边加入最小支撑树,返回一个图
    > 	std::vector<Edge> MiniSpanTree_Kruskal(std::vector<Edge> graph,int number)
    > 	{
    > 		//非连通图
    > 		if (Connected_Component(graph,number) != 1)
    > 		{
    > 			return{};
    > 		}
    > 		std::vector<Edge> MiniSpanTree;
    > 		//在Edge增加了weight成员存储权值，可以直接用sort排序
    > 		std::sort(graph.begin(), graph.end(), [](const Edge& a, const Edge& b)->bool {return a.weight < b.weight; });
    > 
    > 		//辅助数组Vexset,标识各个顶点所属的连通分量,类似于并查集
    > 		std::vector<int> Vexset;
    > 		Vexset.resize(number,0);
    > 		//初始化,表示各顶点自成一个连通分址
    > 		for (int i = 0; i < number; i++)
    > 		{
    > 			Vexset[i] = i;
    > 		}
    > 
    > 		//开始创建最小支撑树
    > 		for (int i = 0; i < graph.size(); i++)
    > 		{
    > 			int v1 = graph[i].u;
    > 			int v2 = graph[i].v;
    > 			int vs1 = Vexset[v1];
    > 			int vs2 = Vexset[v2];
    > 
    > 			//边的两个顶点不在同一连通分量
    > 			if (vs1 != vs2)
    > 			{
    > 				//加入此边
    > 				MiniSpanTree.push_back(Edge(v1, v2));
    > 
    > 				//合并vs1和vs2两个分量，即两个集合统一编号
    > 				for (int j = 0; j < number; j++)
    > 				{
    > 					if (Vexset[j] == vs2)Vexset[j] = vs1;
    > 				}
    > 			}
    > 		}
    > 
    > 		//返回
    > 		return MiniSpanTree;
    > 	}
    > ```
    >
    > 

  

