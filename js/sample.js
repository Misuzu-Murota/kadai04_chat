import { firebaseConfig } from "./firebase.js";

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { 
    getDatabase, ref, push, set, remove, update, onChildAdded, onChildChanged, onChildRemoved, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const dbRef = ref(db,"chat");

//送信
$("#send").on("click",function(){
  // チェックボックスの状態を確認
  const isAnonymous = $("#tokumei").is(":checked");
  // チェックボックスが選択されている場合は「匿名」、そうでない場合は入力された名前
  const uname = isAnonymous ? "匿名" : $("#uname").val();


  const msg = {
    uname: uname,
  sex : $("#sex").val(),
  post : $("#post").val(),
  others : $("#others").val(),
  text : $("#text").val(),
  timestamp: serverTimestamp() // サーバータイムスタンプを追加
  }
  const newPostRef = push(dbRef); //ユニークキーを生成
  console.log(newPostRef);
  set(newPostRef,msg);

  // フォームの内容をクリア
  $("#uname").val(""); // 名前欄を空にする
  $("#sex").val(""); // 性別選択をリセット
  $("#post").val(""); // 役職選択をリセット
  $("#others").val(""); // その他カテゴリ選択をリセット
  $("#text").val(""); // コメント欄を空にする
  $("#tokumei").prop("checked", false); // 匿名チェックボックスをオフにする

});

// HTMLエスケープ関数を定義
function escapeHtml(string) {
    return string
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Firebaseからメッセージを取得して表示する関数
function displayMessages(filter) {
    $('#output').empty(); // メッセージ表示エリアをクリア

// onChildAddedのコールバック内でescapeHtmlを使用する
onChildAdded(dbRef,function(data){
  const msg = data.val();
  const key = data.key; //削除・更新に必須！！

  let dateStr = "";
  if (msg.timestamp) {
      const date = new Date(msg.timestamp);
    dateStr = date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); 
    // toLocaleTimeStringの第二引数で、時刻を分まで表示する設定
  } else {
    dateStr = "送信中..."; // タイムスタンプがまだ設定されていない場合
  }
  
 // フィルタ条件に応じてメッセージを表示する
 if (filter === 'all' || 
    filter === msg.sex || 
    filter === msg.post || 
    filter === msg.others) {

    let h = '<div id="' + key + '" class="message">';
    h += '<div class="info-group">';
    h += '<div class="date">'+`<em>${escapeHtml(dateStr)}</em>`+'</div>'; // 日時を表示    
// 性別を表示する場合のみHTMLに追加
if (msg.sex) {
    let sexClass = "";
    if (msg.sex === "女性") {
        sexClass = "female";
    } else if (msg.sex === "男性") {
        sexClass = "male";
    } else {
        sexClass = "other";
    }
    h += `<div class="sex01 ${sexClass}">${escapeHtml(msg.sex)}</div>`;
}
    
    // 役職を表示する場合のみHTMLに追加
    if (msg.post) {
        let postClass = "";
        if (msg.post === "役員") {
            postClass = "executive";
        } else if (msg.post === "管理職") {
            postClass = "manager";
        } else if (msg.post === "一般社員") {
            postClass = "employee";
        } else if (msg.post === "新入社員") {
            postClass = "newcomer";
        }
        h += `<div class="post01 ${postClass}">${escapeHtml(msg.post)}</div>`;
    }
    
    // その他カテゴリを表示する場合のみHTMLに追加
    if (msg.others) {
        let othersClass = "";
        if (msg.others === "単身赴任中") {
            othersClass = "transfer";
        } else if (msg.others === "介護中") {
            othersClass = "care";
        } else if (msg.others === "子育て中") {
            othersClass = "parenting";
        } else if (msg.others === "一人暮らし") {
            othersClass = "living_alone";
        }
        h += `<div class="others01 ${othersClass}">${escapeHtml(msg.others)}</div>`;
    }
    h += '</div>'; // .info-group の閉じタグ
    h += '<div class="uname01">' + '<strong>氏名：</strong>' + escapeHtml(msg.uname) + '</div>';
    h += '<span contentEditable="true" id="' + key + '_update">' + escapeHtml(msg.text) + '</span>';
    h += '<span class="remove" data-key="' + key + '">削除</span>';
    h += '<span class="update" data-key="' + key + '">up</span>';
    h += '</div>';

    h += '</div>';
    $("#output").prepend(h);
}
});
}


// ページ読み込み時に「すべて」のタブを表示
$(document).ready(function() {
    displayMessages('all');
    $('.tablink').click(function() {
        const filter = $(this).data('filter'); 
        // 全タブから「active」クラスを削除
        $('.tablink').removeClass('active');
        // クリックされたタブに「active」クラスを追加
        $(this).addClass('active');
        // メッセージを表示するフィルター条件を設定
        displayMessages(filter);
    });
});




//削除イベント
$("#output").on("click",".remove",function(){
  const key = $(this).attr("data-key");
  const remove_item = ref(db,"chat/"+key);
  remove(remove_item); //Firebaseのデータ削除
});
//更新イベント
$("#output").on("click", ".update",function(){
  const key = $(this).attr("data-key");
  update(ref(db, "chat/"+key),{
      text: $("#"+key+'_update').html()
  });
});
//削除されたら削除する
onChildRemoved(dbRef, (data) => {
 $("#"+data.key).remove();
});
//更新されたら更新する
onChildChanged(dbRef,(data) => {
  $("#"+data.key+'_update').html(data.val().text);
  $("#"+data.key+'_update').fadeOut(800).fadeIn(800);
});
