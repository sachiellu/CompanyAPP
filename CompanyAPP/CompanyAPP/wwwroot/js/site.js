// Please see documentation at https://learn.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.

function confirmDelete(id) {
    Swal.fire({
        title: '確定要刪除嗎?',
        text: "刪除後將無法復原資料！",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: '是的，刪除它!',
        cancelButtonText: '取消'
    }).then((result) => {
        if (result.isConfirmed) {
            // 抓取對應 ID 的表單並送出
            // 注意：確保你的表單 ID 命名規則全站統一，都是 'delete-form-' + id
            var form = document.getElementById('delete-form-' + id);
            if (form) {
                form.submit();
            } else {
                console.error('找不到刪除表單，ID: delete-form-' + id);
            }
        }
    })
}