package com.nextp.app

import android.app.Application
import com.nextp.app.data.DefaultCategories
import com.nextp.app.data.local.NextPDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class NextPApplication : Application() {

    val database: NextPDatabase by lazy { NextPDatabase.get(this) }

    override fun onCreate() {
        super.onCreate()
        // Semear categorias padrão na primeira execução (idempotente).
        CoroutineScope(Dispatchers.IO).launch {
            val dao = database.categoryDao()
            if (dao.count() == 0) dao.insertAll(DefaultCategories.list)
        }
    }
}
