class Dictionary {
    static type = {
        "income": "Дохід",
        "expense": "Витрати"
    };

    static expenseCategory = {
        "pr": "Продукти",
        "cf": "Кафе",
        "cm": "Кумунальні платежі",
        "md": "Аптека",
        "eva": "Eva/Makeup",
        "zoo": "Зоотовари",
        "cl": "Одяг",
        "usd": "Валюта",
        "ot": "Інше",
    };

    static supabaseUrl = 'https://vntunuzrneoakdckqjvk.supabase.co/rest/v1/fin_statistic';
    static balanceUrl = 'https://vntunuzrneoakdckqjvk.supabase.co/rest/v1/fin_balance';
    static supabaseAuth = 'https://vntunuzrneoakdckqjvk.supabase.co';
    static anonTocken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZudHVudXpybmVvYWtkY2txanZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MTI5NzEsImV4cCI6MjA2NzI4ODk3MX0.CWJIVqq-x5_doDk8rsl8ZJWP7um9VakuIDBihcfsrsU';

    static supabaseToken = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Dictionary.anonTocken}`,
        'apikey': Dictionary.anonTocken
    }
}