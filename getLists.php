<?php
header('Content-Type: text/html; charset=utf-8');
// il faut commencer le script impérativement par la ligne ci-dessus, sinon erreur du type : "Cannot modify header information : headers already sent by"
//echo "Ceci est un caractère : ă"; 


try
{	
  //$bdd = new PDO('mysql:host=bases.sql;dbname=quizzvocabulaire-vocabulaireroumain','quizzvocabulaire', 'fT3snk9nUK');
  $bdd = new PDO('mysql:host=sql.free.fr;dbname=quizvocabroumain','quizvocabroumain', 'Cristina123');
  
  $bdd->exec("SET CHARACTER SET utf8");
}
catch (Exception $e)
{
	echo 'Erreur : ' . $e->getMessage() ;
	die('Erreur : ' . $e->getMessage());
}

//$reponse = $bdd->query('SELECT nodes.*, test_items.* FROM nodes LEFT JOIN test_items ON test_items.id = nodes.test_item_id');

$reponse = $bdd->query('SELECT nodes.id , nodes.name_fr, nodes.name_ro, nodes.parent_id , nodes.test_item_id, nodes.default_selected, test_items.fr, test_items.ro FROM nodes LEFT JOIN test_items ON test_items.id = nodes.test_item_id');




$rows = array();

while ($donnees = $reponse->fetch())
{
	$rows[] = $donnees;
//echo $donnees['fr'];
//echo $donnees['ro'];

}

print json_encode($rows);

$reponse->closeCursor(); // Termine le traitement de la requête

/*$sth = mysql_query("SELECT * FROM  `testItems`");
$rows = array();
while($r = mysql_fetch_assoc($sth)) {
    $rows[] = $r;
}
print json_encode($rows);
*/
?>
