Page({
  data: {
    selectedCategory: 1,
    selectedSubCategory: 'all',
    categories: [
      { id: 1, name: '计算机', icon: '💻' },
      { id: 2, name: '医学', icon: '⚕️' },
      { id: 3, name: '管理学', icon: '💼' },
      { id: 4, name: '英语', icon: '🇬🇧' },
      { id: 5, name: '法律', icon: '🏛️' },
      { id: 6, name: '理工', icon: '🔬' },
      { id: 7, name: '艺术', icon: '🎨' }
    ],
    subCategories: [
      { id: 'all', name: '全部' },
      { id: 'textbook', name: '教材' },
      { id: 'reference', name: '参考书' },
      { id: 'exam', name: '考研资料' }
    ],
    books: [
      {
        id: 1,
        title: 'Java核心技术',
        author: '凯·S·霍斯特曼',
        price: 45,
        sales: 156,
        icon: '📖',
        categoryId: 1,
        subCategoryId: 'textbook'
      },
      {
        id: 2,
        title: '算法导论',
        author: 'Thomas H.Cormen',
        price: 68,
        sales: 89,
        icon: '📘',
        categoryId: 1,
        subCategoryId: 'textbook'
      },
      {
        id: 3,
        title: '深入理解计算机系统',
        author: 'Randal E.Bryant',
        price: 52,
        sales: 76,
        icon: '📗',
        categoryId: 1,
        subCategoryId: 'reference'
      },
      {
        id: 4,
        title: '数据结构与算法分析',
        author: 'Mark Allen Weiss',
        price: 42,
        sales: 124,
        icon: '📙',
        categoryId: 1,
        subCategoryId: 'textbook'
      },
      {
        id: 5,
        title: '设计模式',
        author: 'Gang of Four',
        price: 38,
        sales: 95,
        icon: '📚',
        categoryId: 1,
        subCategoryId: 'reference'
      },
      {
        id: 6,
        title: '计算机网络',
        author: '谢希仁',
        price: 35,
        sales: 156,
        icon: '📕',
        categoryId: 1,
        subCategoryId: 'textbook'
      }
    ]
  },

  onLoad() {
    this.loadBooks()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1
      })
    }
  },

  selectCategory(e: any) {
    const categoryId = e.currentTarget.dataset.id
    this.setData({
      selectedCategory: categoryId,
      selectedSubCategory: 'all'
    })
    this.loadBooks()
  },

  onSubCategoryChange(e: any) {
    this.setData({
      selectedSubCategory: e.detail.value
    })
    this.loadBooks()
  },

  loadBooks() {
    // 这里应该从服务器加载对应分类的书籍数据
    // 目前使用模拟数据
    const { selectedCategory, selectedSubCategory } = this.data
    let filteredBooks = this.data.books.filter((book: any) => book.categoryId === selectedCategory)
    
    if (selectedSubCategory !== 'all') {
      filteredBooks = filteredBooks.filter((book: any) => book.subCategoryId === selectedSubCategory)
    }

    this.setData({
      books: filteredBooks
    })
  },

  goToDetail(e: any) {
    const bookId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/product-detail/product-detail?id=${bookId}`
    })
  }
}) 