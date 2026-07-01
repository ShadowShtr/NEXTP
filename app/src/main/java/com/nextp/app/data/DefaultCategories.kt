package com.nextp.app.data

import com.nextp.app.data.local.entity.Category

/** Categorias iniciais do NextP (semeadas na primeira execução). */
object DefaultCategories {
    val list: List<Category> = listOf(
        Category(name = "Comida", icon = "restaurant", color = 0xFFF79009, isDefault = true),
        Category(name = "Besteira", icon = "icecream", color = 0xFFFF7A9A, isDefault = true),
        Category(name = "Mercado", icon = "shopping_cart", color = 0xFF12B76A, isDefault = true),
        Category(name = "Conta fixa", icon = "receipt_long", color = 0xFF006DFF, isDefault = true),
        Category(name = "Transporte", icon = "directions_bus", color = 0xFF72D7FF, isDefault = true),
        Category(name = "Casa", icon = "home", color = 0xFF9B7EDE, isDefault = true),
        Category(name = "Trabalho", icon = "work", color = 0xFF101828, isDefault = true),
        Category(name = "Família", icon = "family_restroom", color = 0xFFFDB022, isDefault = true),
        Category(name = "Saúde", icon = "favorite", color = 0xFFF04438, isDefault = true),
        Category(name = "Documentos", icon = "description", color = 0xFF667085, isDefault = true),
        Category(name = "Outros", icon = "category", color = 0xFF98A2B3, isDefault = true),
    )
}
