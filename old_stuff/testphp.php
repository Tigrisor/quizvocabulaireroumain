
<?php

header('Content-Type: text/html; charset=utf-8');

//echo "Ceci est un caractère : ă"; 


try
{
  $bdd = new PDO('mysql:host=bases.sql;dbname=quizzvocabulaire-vocabulaireroumain','quizzvocabulaire', 'fT3snk9nUK');
  $bdd->exec("SET CHARACTER SET utf8");
}
catch (Exception $e)
{
//echo 'Erreur : ';
echo 'Erreur : ' . $e->getMessage() ;
        die('Erreur : ' . $e->getMessage());
}

$reponse = $bdd->query('SELECT * FROM testItems');

//$donnees = $reponse->fetch();

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
