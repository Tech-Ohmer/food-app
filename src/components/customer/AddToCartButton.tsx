'use client'

export default function AddToCartButton({
  menuItemId,
  name,
  price,
}: {
  menuItemId: string
  name: string
  price: number
}) {
  function handleClick() {
    window.dispatchEvent(
      new CustomEvent('add-to-cart', {
        detail: { menu_item_id: menuItemId, name, price, quantity: 1 },
      })
    )
    // Visual feedback
    const btn = document.getElementById(`add-btn-${menuItemId}`)
    if (btn) {
      btn.textContent = '✓ Added'
      btn.classList.add('bg-green-500')
      btn.classList.remove('bg-orange-500')
      setTimeout(() => {
        if (btn) {
          btn.textContent = '+ Add'
          btn.classList.remove('bg-green-500')
          btn.classList.add('bg-orange-500')
        }
      }, 800)
    }
  }

  return (
    <button
      id={`add-btn-${menuItemId}`}
      onClick={handleClick}
      className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg transition-colors font-medium whitespace-nowrap"
    >
      + Add
    </button>
  )
}
